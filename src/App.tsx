// src/App.tsx
import {
	ArrowRight,
	CheckCircle2,
	Code2,
	ExternalLink,
	FileText,
	GitBranch,
	Globe,
	HeartHandshake,
	Loader2,
	ShieldCheck,
	Sparkles,
} from "lucide-react"
import { useState } from "react"

type AgentStep = {
	label: string
	status: "complete" | "active" | "error"
}

type AnalysisResult = {
	success: boolean
	steps: string[]
	diff: {
		file: string
		before: string
		after: string
	}
	summary: string
	commitMessage: string
}

type PublishResult = {
	liveUrl: string
	commitHash?: string
}

function App() {
	const [request, setRequest] = useState(
		"Change our meeting time to Fridays at 5 PM in C200."
	)
	const [loading, setLoading] = useState(false)
	const [steps, setSteps] = useState<AgentStep[]>([])
	const [showDiff, setShowDiff] = useState(false)
	const [repoInfo, setRepoInfo] = useState<any>(null)
	const [scanningRepo, setScanningRepo] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
		null
	)
	const [publishStatus, setPublishStatus] = useState<string | null>(null)
	const [publishing, setPublishing] = useState(false)
	const [publishResult, setPublishResult] = useState<PublishResult | null>(null)

	const scanRepo = async () => {
		setScanningRepo(true)

		try {
			const response = await fetch("http://localhost:3001/scan-repo", {
				method: "POST",
			})

			const data = await response.json()
			setRepoInfo(data)
		} catch (error) {
			console.error(error)
		}

		setScanningRepo(false)
	}

	const runAgent = async () => {
		setLoading(true)
		setShowDiff(false)
		setSteps([])
		setAnalysisResult(null)
		setPublishStatus(null)
		setPublishResult(null)

		try {
			const response = await fetch("http://localhost:3001/analyze", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ request }),
			})

			const data: AnalysisResult = await response.json()

			if (!response.ok || !data.success) {
				throw new Error("Analyze request failed")
			}

			setAnalysisResult(data)

			for (let i = 0; i < data.steps.length; i++) {
				await new Promise((resolve) => setTimeout(resolve, 450))

				setSteps((prev) => [
					...prev,
					{
						label: data.steps[i],
						status: "complete",
					},
				])
			}

			setSteps((prev) => [
				...prev,
				{
					label: "Safe change prepared",
					status: "complete",
				},
			])

			setShowDiff(true)
		} catch (error) {
			console.error(error)
			setSteps((prev) => [
				...prev,
				{
					label: "Could not prepare change",
					status: "error",
				},
			])
		}

		setLoading(false)
	}

	const publishWebsite = async () => {
		if (!analysisResult || publishing) return

		setPublishing(true)
		setPublishResult(null)

		try {
			setPublishStatus("Applying approved change...")

			const applyResponse = await fetch("http://localhost:3001/apply-change", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(analysisResult.diff),
			})

			const applyData = await applyResponse.json()

			if (!applyResponse.ok || !applyData.success) {
				throw new Error(applyData.error ?? "Failed to apply change")
			}

			setPublishStatus("Running production build...")

			await new Promise((resolve) => setTimeout(resolve, 700))

			setPublishStatus("Creating Git commit and pushing to GitHub...")

			const publishResponse = await fetch("http://localhost:3001/publish", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					commitMessage: analysisResult.commitMessage,
				}),
			})

			const publishData = await publishResponse.json()

			if (!publishResponse.ok || !publishData.success) {
				throw new Error(publishData.error ?? "Publish failed")
			}

			setPublishStatus("Deployment triggered successfully")
			setPublishResult({
				liveUrl: publishData.liveUrl,
				commitHash: publishData.commitHash,
			})
		} catch (error) {
			console.error(error)
			setPublishStatus(
				error instanceof Error ? error.message : "Failed to publish website"
			)
		}

		setPublishing(false)
	}

	return (
		<main className="min-h-screen bg-[#fffaf7] text-slate-900">
			<section className="mx-auto max-w-7xl px-6 py-8">
				<nav className="mb-10 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8f7dc] shadow-sm">
							<HeartHandshake className="h-6 w-6 text-emerald-700" />
						</div>
						<div>
							<h1 className="text-xl font-bold">Handoff</h1>
							<p className="text-sm text-slate-500">
								AI website steward for nonprofits
							</p>
						</div>
					</div>

					<a
						href="https://hhscybersec.github.io"
						target="_blank"
						rel="noreferrer"
						className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
					>
						Open live site
					</a>
				</nav>

				<div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
					<section className="rounded-[2rem] border border-white bg-white/80 p-8 shadow-sm">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#ede9fe] px-4 py-2 text-sm font-medium text-purple-700">
							<Sparkles className="h-4 w-4" />
							Safe website updates without touching code
						</div>

						<h2 className="max-w-2xl text-5xl font-bold tracking-tight">
							Give every nonprofit a calm, safe way to maintain their website.
						</h2>

						<p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
							Handoff scans a website repo, explains how it works, proposes
							safe edits, runs build checks, and publishes approved changes.
						</p>

						<div className="mt-8 grid gap-4 md:grid-cols-3">
							<Feature
								icon={<FileText />}
								title="Website handbook"
								color="bg-[#d9f99d]"
							/>
							<Feature
								icon={<ShieldCheck />}
								title="Approval-first edits"
								color="bg-[#fbcfe8]"
							/>
							<Feature
								icon={<GitBranch />}
								title="Git publishing"
								color="bg-[#fed7aa]"
							/>
						</div>
					</section>

					<section className="rounded-[2rem] border border-white bg-white p-6 shadow-sm">
						<div className="mb-5 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold">Demo repo</h3>
								<p className="text-sm text-slate-500">
									Cybersecurity club website connected
								</p>
							</div>
							<div className="rounded-full bg-[#c8f7dc] px-3 py-1 text-sm font-medium text-emerald-700">
								{repoInfo?.success ? "Scanned" : "Ready"}
							</div>
						</div>

						<div className="space-y-3">
							<RepoItem
								icon={<GitBranch />}
								label="Repo"
								value={repoInfo?.repo?.name ?? "hhscybersec.github.io"}
							/>
							<RepoItem
								icon={<Code2 />}
								label="Framework"
								value={repoInfo?.detected?.framework ?? "Not scanned yet"}
							/>
							<RepoItem
								icon={<Globe />}
								label="Package manager"
								value={repoInfo?.detected?.packageManager ?? "Not scanned yet"}
							/>
						</div>

						<button
							onClick={scanRepo}
							disabled={scanningRepo}
							className="mt-4 w-full rounded-2xl bg-[#c8f7dc] px-5 py-3 font-semibold text-emerald-800 disabled:opacity-50"
						>
							{scanningRepo ? "Scanning repo..." : "Scan real repo"}
						</button>

						<div className="mt-6 rounded-3xl bg-[#f8fafc] p-5">
							<h4 className="mb-3 font-semibold">Website handbook</h4>
							<ul className="space-y-2 text-sm text-slate-600">
								{repoInfo?.handbook ? (
									repoInfo.handbook.map((item: string) => (
										<li key={item}>• {item}</li>
									))
								) : (
									<>
										<li>• Click “Scan real repo” to inspect the website.</li>
										<li>• Handoff will detect the framework and scripts.</li>
										<li>• Safe content areas will appear here.</li>
										<li>• Approved edits can publish to the live site.</li>
									</>
								)}
							</ul>
						</div>
					</section>
				</div>

				<section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
					<div className="rounded-[2rem] bg-white p-6 shadow-sm">
						<h3 className="mb-4 text-lg font-bold">Ask Handoff</h3>

						<textarea
							value={request}
							onChange={(event) => setRequest(event.target.value)}
							className="min-h-32 w-full resize-none rounded-3xl border border-slate-200 bg-[#fffaf7] p-4 text-sm outline-none focus:border-purple-300"
						/>

						<button
							onClick={runAgent}
							disabled={loading || publishing}
							className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ddd6fe] px-5 py-3 font-semibold text-purple-800 transition hover:scale-[1.01] disabled:opacity-50"
						>
							{loading ? "Preparing change..." : "Prepare safe change"}
							<ArrowRight className="h-4 w-4" />
						</button>

						<div className="mt-6 space-y-3">
							{steps.length === 0 ? (
								<p className="rounded-2xl bg-[#f8fafc] p-4 text-sm text-slate-400">
									Agent steps will appear here.
								</p>
							) : (
								steps.map((step, index) => (
									<div
										key={`${step.label}-${index}`}
										className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] p-3"
									>
										{step.status === "active" && (
											<Loader2 className="h-5 w-5 animate-spin text-purple-600" />
										)}
										{step.status === "complete" && (
											<CheckCircle2 className="h-5 w-5 text-emerald-600" />
										)}
										{step.status === "error" && (
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
												!
											</span>
										)}
										<span className="text-sm font-medium">{step.label}</span>
									</div>
								))
							)}
						</div>
					</div>

					<div className="rounded-[2rem] bg-white p-6 shadow-sm">
						<div className="mb-5 flex items-center justify-between">
							<div>
								<h3 className="text-lg font-bold">Proposed change</h3>
								<p className="text-sm text-slate-500">
									Handoff will show a safe diff before editing
								</p>
							</div>
							<span className="rounded-full bg-[#fed7aa] px-3 py-1 text-sm font-medium text-orange-700">
								Approval required
							</span>
						</div>

						{showDiff && analysisResult ? (
							<>
								<div className="rounded-3xl bg-slate-950 p-5 font-mono text-sm text-slate-100">
									<p className="text-slate-400">{analysisResult.diff.file}</p>
									<div className="mt-4 space-y-1">
										<p className="text-red-300">
											- {analysisResult.diff.before}
										</p>
										<p className="text-emerald-300">
											+ {analysisResult.diff.after}
										</p>
									</div>
								</div>

								<div className="mt-5 rounded-3xl bg-[#f0fdf4] p-5">
									<h4 className="font-semibold text-emerald-800">
										Plain-English summary
									</h4>
									<p className="mt-2 text-sm leading-6 text-emerald-700">
										{analysisResult.summary}
									</p>
									<p className="mt-3 text-xs font-medium text-emerald-700">
										Commit message: {analysisResult.commitMessage}
									</p>
								</div>

								<div className="mt-5 flex gap-3">
									<button
										onClick={publishWebsite}
										disabled={publishing}
										className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
									>
										{publishing ? "Publishing..." : "Approve & publish"}
									</button>
									<button
										onClick={() => setPublishStatus("Change rejected")}
										disabled={publishing}
										className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 disabled:opacity-50"
									>
										Reject
									</button>
								</div>

								{publishStatus && (
									<p className="mt-4 rounded-2xl bg-[#f8fafc] p-4 text-sm font-medium text-slate-600">
										{publishing && (
											<Loader2 className="mr-2 inline h-4 w-4 animate-spin text-purple-600" />
										)}
										{publishStatus}
									</p>
								)}

								{publishResult && (
									<a
										href={publishResult.liveUrl}
										target="_blank"
										rel="noreferrer"
										className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#c8f7dc] px-5 py-3 text-sm font-semibold text-emerald-800"
									>
										Open updated live site
										<ExternalLink className="h-4 w-4" />
									</a>
								)}
							</>
						) : (
							<div className="flex h-[420px] items-center justify-center rounded-3xl bg-[#f8fafc] text-sm text-slate-400">
								Agent output will appear here.
							</div>
						)}
					</div>
				</section>
			</section>
		</main>
	)
}

function Feature({
	icon,
	title,
	color,
}: {
	icon: React.ReactNode
	title: string
	color: string
}) {
	return (
		<div className="rounded-3xl bg-[#f8fafc] p-4">
			<div
				className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}
			>
				<div className="h-5 w-5 text-slate-800">{icon}</div>
			</div>
			<p className="font-semibold">{title}</p>
		</div>
	)
}

function RepoItem({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode
	label: string
	value: string
}) {
	return (
		<div className="flex items-center justify-between rounded-2xl bg-[#f8fafc] p-4">
			<div className="flex items-center gap-3 text-slate-500">
				<div className="h-5 w-5">{icon}</div>
				<span className="text-sm">{label}</span>
			</div>
			<span className="text-sm font-semibold">{value}</span>
		</div>
	)
}

export default App