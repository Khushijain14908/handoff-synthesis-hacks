// server/index.ts
import "dotenv/config"
import express from "express"
import cors from "cors"
import simpleGit from "simple-git"
import fs from "fs-extra"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"
import { GoogleGenerativeAI } from "@google/generative-ai"

const execAsync = promisify(exec)

const app = express()

app.use(cors())
app.use(express.json())

const REPO_URL = "https://github.com/djarty24/community-response-public-site"
const REPO_DIR = path.join(process.cwd(), "repos", "community-response-public-site")
const LIVE_SITE_URL = "https://community-response-public-site.vercel.app/"
const MODEL_NAME = "gemini-2.5-flash"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")

type CandidateSnippet = {
  file: string
  content: string
}

type GeminiProposal = {
  file: string
  before: string
  after: string
  summary: string
  commitMessage?: string
}

app.get("/", (_, res) => {
  res.json({ message: "Handoff server running" })
})

app.post("/scan-repo", async (_, res) => {
  try {
    await ensureRepoReady()

    const files = await getFiles(REPO_DIR)
    const packageJsonPath = path.join(REPO_DIR, "package.json")
    const hasPackageJson = await fs.pathExists(packageJsonPath)
    const packageJson = hasPackageJson ? await fs.readJson(packageJsonPath) : null

    res.json({
      success: true,
      repo: {
        name: "hhscybersec.github.io",
        url: REPO_URL,
        liveUrl: LIVE_SITE_URL,
      },
      detected: {
        hasPackageJson,
        framework: detectFramework(packageJson, files),
        packageManager: await detectPackageManager(REPO_DIR),
      },
      handbook: [
        "Repo cloned locally for safe analysis.",
        "Gemini identifies safe visible content edits.",
        "Build checks run before publishing.",
        "Approved edits publish directly to the live GitHub Pages site.",
      ],
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

app.post("/analyze", async (req, res) => {
  try {
    const { request } = req.body as { request?: string }

    if (!request) {
      res.status(400).json({ success: false, error: "Missing request" })
      return
    }

    await ensureRepoReady()

    const candidates = await collectCandidateSnippets()
    const proposal = await getGeminiProposal(request, candidates)

    res.json({
      success: true,
      steps: [
        "Scanning cybersecurity club repo",
        "Collecting safe content snippets",
        "Asking Gemini to identify the right edit",
        "Preparing safe content-only diff",
        "Ready for approval",
      ],
      diff: {
        file: proposal.file,
        before: proposal.before,
        after: proposal.after,
      },
      summary: proposal.summary,
      commitMessage: proposal.commitMessage ?? "Update website content",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

app.post("/apply-change", async (req, res) => {
  try {
    const { file, before, after } = req.body as {
      file?: string
      before?: string
      after?: string
    }

    if (!file || !before || !after) {
      res.status(400).json({
        success: false,
        error: "Missing file, before, or after",
      })
      return
    }

    const fullPath = path.resolve(REPO_DIR, file)

    if (!fullPath.startsWith(path.resolve(REPO_DIR))) {
      res.status(400).json({ success: false, error: "Invalid file path" })
      return
    }

    const content = await fs.readFile(fullPath, "utf8")

    if (!content.includes(before)) {
      res.status(400).json({
        success: false,
        error: "Before text was not found in the selected file",
      })
      return
    }

    const updatedContent = content.replace(before, after)
    await fs.writeFile(fullPath, updatedContent, "utf8")

    res.json({
      success: true,
      message: "Change applied locally",
      file,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

app.post("/publish", async (req, res) => {
  try {
    const { commitMessage } = req.body as { commitMessage?: string }

    const git = simpleGit(REPO_DIR)
    const status = await git.status()

    if (status.files.length === 0) {
      res.status(400).json({
        success: false,
        error: "No local changes to publish",
      })
      return
    }

    await execAsync("npm run build", { cwd: REPO_DIR })

    await git.add(".")
    const commitResult = await git.commit(
      sanitizeCommitMessage(commitMessage ?? "Update website content")
    )

    await git.push("origin", "main")

    res.json({
      success: true,
      message: "Website published successfully",
      commitHash: commitResult.commit,
      liveUrl: LIVE_SITE_URL,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

app.post("/publish-public-update", async (req, res) => {
  try {
    const { title, announcement, faqs, smsSummary } = req.body as {
      title?: string
      announcement?: string
      faqs?: { question: string; answer: string }[]
      smsSummary?: string
    }

    if (!title || !announcement || !faqs || !smsSummary) {
      res.status(400).json({
        success: false,
        error: "Missing title, announcement, faqs, or smsSummary",
      })
      return
    }

    await ensureRepoReady()

    const appFilePath = path.join(REPO_DIR, "src", "App.tsx")
    const content = await fs.readFile(appFilePath, "utf8")

    const startMarker = "// HANDOFF_UPDATE_START"
    const endMarker = "// HANDOFF_UPDATE_END"

    const startIndex = content.indexOf(startMarker)
    const endIndex = content.indexOf(endMarker)

    if (startIndex === -1 || endIndex === -1) {
      res.status(400).json({
        success: false,
        error: "Could not find Handoff update markers in public site App.tsx",
      })
      return
    }

    const now = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })

    const newBlock = `${startMarker}
const emergencyUpdate = ${JSON.stringify(
      {
        title,
        announcement,
        location: "Sunnyvale Community Response Area",
        severity: "Active Update",
        lastUpdated: now,
        faqs,
        sms: smsSummary,
      },
      null,
      2
    )}
${endMarker}`

    const updatedContent =
      content.slice(0, startIndex) +
      newBlock +
      content.slice(endIndex + endMarker.length)

    await fs.writeFile(appFilePath, updatedContent, "utf8")

    await execAsync("npm install", { cwd: REPO_DIR })
    await execAsync("npm run build", { cwd: REPO_DIR })

    const git = simpleGit(REPO_DIR)

    await git.add(".")
    const commitResult = await git.commit(`Publish public response update`)
    await git.push("origin", "main")

    res.json({
      success: true,
      message: "Public response site published",
      liveUrl: LIVE_SITE_URL,
      commitHash: commitResult.commit,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

async function ensureRepoReady() {
  await fs.ensureDir(path.join(process.cwd(), "repos"))

  const repoExists = await fs.pathExists(REPO_DIR)

  if (!repoExists) {
    await simpleGit().clone(REPO_URL, REPO_DIR)
  } else {
    const git = simpleGit(REPO_DIR)
    const status = await git.status()

    if (status.files.length === 0) {
      await git.pull()
    }
  }
}

async function collectCandidateSnippets(): Promise<CandidateSnippet[]> {
  const files = await getFiles(REPO_DIR)

  const safeFiles = files.filter((file) =>
    [".tsx", ".ts", ".jsx", ".js", ".html"].some((extension) =>
      file.endsWith(extension)
    )
  )

  const prioritizedFiles = safeFiles
    .filter((file) => {
      const lower = file.toLowerCase()

      return (
        lower.includes("src/") ||
        lower.includes("components") ||
        lower.includes("pages") ||
        lower.includes("home")
      )
    })
    .slice(0, 15)

  const snippets: CandidateSnippet[] = []

  for (const file of prioritizedFiles) {
    const fullPath = path.join(REPO_DIR, file)
    const content = await fs.readFile(fullPath, "utf8")

    snippets.push({
      file,
      content: content.slice(0, 2000),
    })
  }

  console.log("Sending", snippets.length, "candidate files to Gemini")

  return snippets
}

async function getGeminiProposal(
  userRequest: string,
  candidates: CandidateSnippet[]
): Promise<GeminiProposal> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in server/.env")
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME })

  const prompt = `
You are Handoff, an AI website steward for nonprofits and student organizations.

Given a user request and repo snippets, identify the safest visible text edit.

Rules:
- Only modify visible website text.
- Never modify config, dependencies, scripts, deployment settings, or styling systems.
- Prefer source code files over documentation.
- The "before" value MUST exactly exist in one provided snippet.
- The "after" value should be the replacement text.
- The commitMessage should be short, specific, and imperative.
- Return ONLY valid JSON. No markdown.

User request:
${userRequest}

Candidate snippets:
${JSON.stringify(candidates, null, 2)}

Return:
{
  "file": "path/to/file",
  "before": "existing text",
  "after": "replacement text",
  "summary": "plain English explanation",
  "commitMessage": "short git commit message"
}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = stripJsonMarkdown(text)
  const parsed = JSON.parse(cleaned) as GeminiProposal

  if (!parsed.file || !parsed.before || !parsed.after || !parsed.summary) {
    throw new Error("Gemini returned an incomplete proposal")
  }

  const chosenSnippet = candidates.find(
    (candidate) => candidate.file === parsed.file
  )

  if (!chosenSnippet) {
    throw new Error("Gemini chose a file that was not provided")
  }

  if (!chosenSnippet.content.includes(parsed.before)) {
    throw new Error("Gemini before text was not found in the chosen file")
  }

  return parsed
}

function stripJsonMarkdown(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim()
}

function sanitizeCommitMessage(message: string) {
  return message.replace(/[\n\r]/g, " ").trim().slice(0, 72)
}

async function getFiles(
  directory: string,
  baseDirectory = directory
): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)

    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "build" ||
      entry.name === ".next"
    ) {
      continue
    }

    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath, baseDirectory)))
    } else {
      files.push(path.relative(baseDirectory, fullPath))
    }
  }

  return files
}

async function detectPackageManager(repoDirectory: string) {
  if (await fs.pathExists(path.join(repoDirectory, "pnpm-lock.yaml"))) {
    return "pnpm"
  }

  if (await fs.pathExists(path.join(repoDirectory, "yarn.lock"))) {
    return "yarn"
  }

  if (await fs.pathExists(path.join(repoDirectory, "package-lock.json"))) {
    return "npm"
  }

  return "unknown"
}

function detectFramework(packageJson: any, files: string[]) {
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  }

  if (dependencies.next) return "Next.js"
  if (dependencies.vite) return "Vite"
  if (dependencies.react) return "React"
  if (files.includes("index.html")) return "Static HTML"

  return "Unknown"
}

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001")
})