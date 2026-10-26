# Video-to-SOP demo

A client-ready GitHub Copilot canvas demo that presents a reviewable standard operating procedure (SOP) from selected video evidence. It includes a safe sample draft, timestamped screenshots, and a standalone HTML export.

> **Draft evidence, not an approved procedure.** The included SOP documents visible actions from a demonstration recording. It has not been approved by a process owner and must be reviewed before operational use.

## What is included

| Path | Purpose |
| --- | --- |
| `.github/extensions/video-sop/` | Reusable Copilot canvas extension that reads an SOP bundle from the current workspace |
| `sop-artifacts/mona-cli-demo/sop.json` | Sample SOP data: nine documented steps and review checklist |
| `sop-artifacts/mona-cli-demo/frames/` | Thirteen timestamped JPEG screenshots used as evidence |
| `sop-artifacts/mona-cli-demo/mona-cli-demo-sop.html` | Self-contained HTML export with the same screenshots embedded |

The original video is intentionally **not** included. The selected frames are enough to run the lightweight demo and avoid distributing a much larger recording that may contain account or desktop context.

## Quick demo

1. Clone this repository and open it in a GitHub Copilot CLI/App session that supports project extensions.
2. Ensure the project extension is discovered, then open the **Video to SOP** canvas with:

   ```json
   {
     "documentId": "mona-cli-demo"
   }
   ```

   The default artifact location is `sop-artifacts/<documentId>`.
3. Use the canvas to review the step list, screenshots, instructions, cautions, and human-review checklist. Use **Download HTML + screenshots** to generate a portable export from the active artifact bundle.
4. For a no-runtime presentation, open `sop-artifacts/mona-cli-demo/mona-cli-demo-sop.html` in a browser. It is already self-contained and does not require the extension.

The canvas accepts an optional `artifactRoot` containing only simple directory segments. For example, an SOP stored under `examples/forklift-loading/<documentId>` can be opened with:

```json
{
  "documentId": "daily-loading-check",
  "artifactRoot": "examples/forklift-loading"
}
```

## Add another SOP artifact

Create a bundle below a workspace-relative artifact root:

```text
sop-artifacts/
  your-procedure/
    sop.json
    frames/
      frame-001.jpg
      frame-002.jpg
```

`documentId` must match the directory name. Each step in `sop.json` must reference a frame named `frame-###.jpg`; the extension verifies that the referenced files begin with a JPEG signature before returning the document. Use the sample JSON as the field-level template. Keep the final approval status and review checklist accurate for the target process.

## Privacy and data handling

- Review and redact recordings, screenshots, prompts, account names, browser tabs, file paths, and customer data before adding them to a repository or export.
- Keep original recordings in an approved storage location. `source-videos/` and `*.mp4` are ignored by default to reduce accidental commits.
- The extension only serves the requested artifact from a loopback HTTP server and restricts artifact resolution to the current workspace.
- Generated text and visual inference are draft material. Confirm the procedure, commands, prerequisites, permissions, and expected results with a qualified reviewer.

## Requirements and limitations

- The project extension runs in a GitHub Copilot CLI/App environment that supports Copilot canvas extensions. It imports the SDK supplied by that environment; this repository does not bundle an SDK or Node dependencies.
- This repository contains selected frames and no video-processing pipeline. To make a new SOP from a recording, you need an approved frame-extraction workflow outside this demo.
- No audio was transcribed for the sample. If narration matters, use an approved transcription workflow and have a reviewer reconcile it with the visual evidence.
- The extension can display and export a prepared bundle. It does not prove that the recorded workflow, generated code, remote access, or mobile behavior works in another environment.

## Repository sharing versus a connected CLI session

Cloning this repository gives a client the reusable extension, sample evidence, and standalone export. It does **not** transfer the creator's Copilot conversation, credentials, permissions, or a live remote-control connection.

To continue work in a connected CLI session, the client must start and authenticate their own Copilot CLI session, subject to their account and organization policies. If their CLI offers remote-session support, they can enable it for that new session and use the session link it generates. A session link belongs to the running session; it is not stored in this repository and should not be shared as a substitute for repository access.

## Client handoff checklist

1. Confirm the client can clone the private repository and use the required Copilot environment.
2. Review the sample screenshots and SOP text for any organization-specific context before presenting or redistributing it.
3. Demonstrate the standalone HTML first, then the canvas if the client environment supports it.
4. For client recordings, agree on approved storage, redaction, transcription, and process-owner review before committing any artifacts.
