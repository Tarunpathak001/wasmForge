import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const artifactsDir = path.join(workspaceRoot, "artifacts");
const baseUrl = process.env.WASMFORGE_VERIFY_URL || "http://localhost:5173";
const ideUrl = new URL("/ide", baseUrl).toString();
const verificationWorkspace = `playwright-notebook-${Date.now().toString(36)}`;
const notebookFilename = "analysis.wfnb";
const SHARE_PAYLOAD_VERSION = 1;

async function ensureArtifactsDir() {
  await fs.mkdir(artifactsDir, { recursive: true });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function encodeSharePayload(filename, code) {
  return Buffer.from(
    JSON.stringify({
      v: SHARE_PAYLOAD_VERSION,
      f: filename,
      c: code,
    }),
    "utf8",
  )
    .toString("base64")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(/=+$/gu, "");
}

async function openWorkspaceMenu(page) {
  await page.getByLabel("Workspace switcher").click();
  await page.getByText("Workspaces", { exact: true }).waitFor();
}

async function ensureVerificationWorkspace(page) {
  await openWorkspaceMenu(page);
  const workspaceButton = page.getByRole("button", {
    name: new RegExp(`^${escapeRegExp(verificationWorkspace)}$`),
  });

  if (await workspaceButton.count()) {
    await workspaceButton.click();
    return;
  }

  await page.getByPlaceholder("workspace-name").fill(verificationWorkspace);
  await page.getByRole("button", { name: "Add" }).click();
  await page.locator(`button[title="${verificationWorkspace}"]`).first().waitFor();
}

async function ensureServiceWorkerControl(page) {
  await page.waitForFunction(() => "serviceWorker" in navigator, undefined, { timeout: 30000 });
  await page.waitForFunction(
    async () => {
      try {
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    },
    undefined,
    { timeout: 30000 },
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const hasController = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
    if (hasController) {
      return;
    }

    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.getByRole("button", { name: /Run/ }).waitFor({ timeout: 60000 });
    await page.waitForTimeout(1000);
  }

  throw new Error("Service worker never took control of /ide");
}

async function waitForShellRunButton(page, timeout = 60000) {
  await page.locator(".wf-run-btn").waitFor({ timeout });
}

async function openOrCreateNotebook(page) {
  const notebookRow = page.getByText(notebookFilename, { exact: true });
  if (await notebookRow.count()) {
    await notebookRow.first().click();
    return notebookFilename;
  }

  await page.getByTitle("Create notebook").click();
  await page.getByText(notebookFilename, { exact: true }).first().waitFor({ timeout: 20000 });
  await page.getByText(notebookFilename, { exact: true }).first().click();
  return notebookFilename;
}

async function waitForNotebookReady(page) {
  await page.getByRole("heading", { name: "Python Notebook" }).waitFor({ timeout: 30000 });
  await page.getByRole("region", { name: "Cell 1" }).waitFor({ timeout: 30000 });
}

async function selectCell(page, cellNumber) {
  const cellRegion = page.getByRole("region", { name: `Cell ${cellNumber}` }).first();
  await cellRegion.getByRole("button", { name: `Cell ${cellNumber}` }).click();
  await cellRegion.getByRole("group", { name: `Cell ${cellNumber} editor` }).waitFor({ timeout: 20000 });
  return cellRegion;
}

async function focusCellEditor(page, cellNumber) {
  const cellRegion = await selectCell(page, cellNumber);
  await cellRegion.locator(".monaco-editor").first().click({ position: { x: 180, y: 24 } });
}

async function setCellValue(page, cellNumber, content) {
  await focusCellEditor(page, cellNumber);
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(content);
}

async function addCellAfter(page, cellNumber) {
  const cellRegion = page.getByRole("region", { name: `Cell ${cellNumber}` }).first();
  await cellRegion.getByRole("button", { name: "Add code cell" }).click();
}

async function runCell(page, cellNumber) {
  const cellRegion = page.getByRole("region", { name: `Cell ${cellNumber}` }).first();
  await cellRegion.getByRole("button", { name: "Run cell" }).click();
}

async function deleteCell(page, cellNumber) {
  const cellRegion = page.getByRole("region", { name: `Cell ${cellNumber}` }).first();
  await cellRegion.getByRole("button", { name: "Delete" }).click();
}

async function waitForNotebookIdle(page, timeout = 60000) {
  await page.waitForFunction(
    () => {
      const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
        candidate.textContent?.trim() === "Run all cells",
      );
      return Boolean(button) && !button.disabled;
    },
    undefined,
    { timeout },
  );
}

async function waitForCellOutputText(page, cellNumber, text, timeout = 20000) {
  const outputRegion = page.getByRole("region", { name: `Cell ${cellNumber} output` });
  await outputRegion.waitFor({ timeout });
  await page.waitForFunction(
    ({ expected, label }) => {
      const region = Array.from(document.querySelectorAll('[role="region"]')).find((element) =>
        element.getAttribute("aria-label") === label,
      );
      return Boolean(region?.textContent?.includes(expected));
    },
    { expected: text, label: `Cell ${cellNumber} output` },
    { timeout },
  );
}

async function waitForCellFigure(page, cellNumber, timeout = 60000) {
  const outputRegion = page.getByRole("region", { name: `Cell ${cellNumber} output` });
  await outputRegion.waitFor({ timeout });
  await outputRegion.locator('img[alt*="Figure"]').first().waitFor({ timeout });
}

async function waitForCellTable(page, cellNumber, value, timeout = 20000) {
  const outputRegion = page.getByRole("region", { name: `Cell ${cellNumber} output` });
  await outputRegion.waitFor({ timeout });
  await outputRegion.getByRole("table", { name: /DataFrame/i }).waitFor({ timeout });
  await outputRegion.getByRole("cell", { name: value, exact: true }).waitFor({ timeout });
}

async function waitForCellMissing(page, cellNumber, timeout = 20000) {
  await page.waitForFunction(
    (label) => !Array.from(document.querySelectorAll('[role="region"]')).some((element) =>
      element.getAttribute("aria-label") === label),
    `Cell ${cellNumber}`,
    { timeout },
  );
}

async function verifyNotebookFlow(page) {
  await waitForNotebookReady(page);
  await waitForNotebookIdle(page, 90000);

  await setCellValue(page, 1, "value = 41");
  await setCellValue(page, 2, "print(value + 1)");
  await setCellValue(
    page,
    3,
    'import pandas as pd\n\ndisplay(pd.DataFrame([\n    {"name": "Ada", "score": 42},\n    {"name": "Linus", "score": 36},\n]))',
  );

  await addCellAfter(page, 3);
  await setCellValue(
    page,
    4,
    'import matplotlib.pyplot as plt\n\nplt.plot([1, 2, 3], [1, 4, 9])\nplt.title("Notebook Plot")\nplt.show()',
  );

  await runCell(page, 1);
  await waitForNotebookIdle(page);
  await runCell(page, 2);
  await waitForNotebookIdle(page);
  await waitForCellOutputText(page, 2, "42");

  await setCellValue(page, 1, "value = 99");
  await runCell(page, 1);
  await waitForNotebookIdle(page);
  await runCell(page, 2);
  await waitForNotebookIdle(page);
  await waitForCellOutputText(page, 2, "100");

  await runCell(page, 3);
  await waitForNotebookIdle(page);
  await waitForCellTable(page, 3, "Ada");
  await waitForCellTable(page, 3, "42");

  await runCell(page, 4);
  await waitForNotebookIdle(page);
  await waitForCellFigure(page, 4);
}

async function verifyNotebookRecoveryControls(page) {
  await addCellAfter(page, 4);
  await setCellValue(page, 5, 'print("temporary-cell")');
  await runCell(page, 5);
  await waitForNotebookIdle(page);
  await waitForCellOutputText(page, 5, "temporary-cell");

  await page.getByRole("button", { name: "Restart Python session" }).click();
  await waitForNotebookIdle(page, 90000);

  await runCell(page, 2);
  await waitForNotebookIdle(page, 90000);
  await waitForCellOutputText(page, 2, "NameError");

  await deleteCell(page, 5);
  await waitForCellMissing(page, 5);
}

async function verifyNotebookPersistence(page) {
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForShellRunButton(page, 60000);
  await page.waitForTimeout(1200);
  await page.getByText(notebookFilename, { exact: true }).first().click();
  await waitForNotebookReady(page);
  await waitForNotebookIdle(page, 90000);
  await page.getByRole("region", { name: "Cell 1" }).getByText("value = 99", { exact: false }).waitFor({ timeout: 20000 });
  await page.getByRole("button", { name: "Run all cells" }).click();
  await waitForNotebookIdle(page, 90000);
  await waitForCellOutputText(page, 2, "100", 60000);
  await waitForCellTable(page, 3, "Linus", 60000);
  await waitForCellFigure(page, 4, 60000);
}

async function verifyNotebookOffline(page) {
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForShellRunButton(page, 60000);
  await page.waitForTimeout(1200);
  await page.getByText(notebookFilename, { exact: true }).first().click();
  await waitForNotebookReady(page);
  await waitForNotebookIdle(page, 90000);
  await page.getByRole("button", { name: "Run all cells" }).click();
  await waitForNotebookIdle(page, 90000);
  await waitForCellOutputText(page, 2, "100", 60000);
  await waitForCellTable(page, 3, "Ada", 60000);
  await waitForCellFigure(page, 4, 60000);
  await page.context().setOffline(false);
}

async function verifyNotebookRepair(page) {
  const brokenNotebookUrl = `${ideUrl}#share=${encodeSharePayload("broken.wfnb", "{ invalid notebook")}`;
  await page.goto(brokenNotebookUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForShellRunButton(page, 60000);
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Repair notebook" }).waitFor({ timeout: 60000 });
  await page.getByRole("button", { name: "Repair notebook" }).click();
  await waitForNotebookReady(page);
  await waitForNotebookIdle(page, 90000);
  await page.getByRole("button", { name: "Run all cells" }).click();
  await waitForNotebookIdle(page, 90000);
  await waitForCellTable(page, 2, "Ada", 60000);
  await waitForCellFigure(page, 3, 60000);
}

async function main() {
  await ensureArtifactsDir();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 980 } });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text.includes("Canceled: Canceled")) {
        return;
      }
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    const text = String(error);
    if (text.includes("Canceled: Canceled")) {
      return;
    }
    consoleErrors.push(text);
  });

  try {
    await page.goto(ideUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await waitForShellRunButton(page, 60000);
    await page.waitForTimeout(1500);
    await ensureVerificationWorkspace(page);
    await ensureServiceWorkerControl(page);
    await openOrCreateNotebook(page);
    await verifyNotebookFlow(page);
    await verifyNotebookRecoveryControls(page);
    await verifyNotebookPersistence(page);
    await verifyNotebookOffline(page);
    await verifyNotebookRepair(page);

    await page.screenshot({
      path: path.join(artifactsDir, "verify-notebook.png"),
      fullPage: true,
    });

    console.log(JSON.stringify({
      baseUrl,
      ideUrl,
      workspace: verificationWorkspace,
      notebookSmoke: "ok",
      notebookSharedSession: "ok",
      notebookDataFrame: "ok",
      notebookMatplotlib: "ok",
      notebookRecoveryControls: "ok",
      notebookPersistence: "ok",
      notebookOffline: "ok",
      notebookRepair: "ok",
      consoleErrors,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
