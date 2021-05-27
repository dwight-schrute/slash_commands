const buildStatus = await Deno.run({
  cmd: [
    Deno.execPath(),
    "install",
    "--allow-net",
    "--allow-read",
    "--allow-write",
    "--allow-env",
    "--allow-run",
    "--no-check",
    "-f",
    "https://deno.land/x/deploy/deployctl.ts"
  ],
  stdout: "inherit",
  stderr: "inherit",
}).status();

console.log(`Build Exit Code: ${buildStatus.code}`);
