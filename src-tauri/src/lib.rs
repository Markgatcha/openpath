// OpenPath desktop shell — application logic.
//
// Architecture (see src-tauri/README.md):
//   * The Tauri window loads http://127.0.0.1:<port>/ — the unchanged Fastify
//     server (bundled as a Node sidecar) serves BOTH the API and the built SPA.
//   * The server binary is a renamed Node runtime that runs `app.cjs`
//     (esbuild bundle of dist/server + prod deps). better-sqlite3 is N-API
//     ABI-stable and ships as a ~2 MB prebuilt .node per platform.
//   * The SQLite file lives in the per-user app-data dir, so migrations and
//     backups behave exactly like the server repo.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::path::BaseDirectory;
use tauri::{Manager, RunEvent, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

struct Sidecar(Mutex<Option<CommandChild>>);

/// Find a free localhost port (bind :0, read it, drop the listener).
/// Avoids colliding with a dev server on the default 8787.
fn free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .unwrap_or(18_787)
}

fn wait_ready(port: u16, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    let addr = format!("127.0.0.1:{port}");
    while Instant::now() < deadline {
        if let Ok(addr) = addr.parse() {
            if TcpStream::connect_timeout(&addr, Duration::from_millis(250)).is_ok() {
                return true;
            }
        }
        std::thread::sleep(Duration::from_millis(150));
    }
    false
}

/// JWT secret: stable per install, persisted in the app-data dir beside the DB.
/// Local-only single-user app, so a time/pid-derived 64-bit secret is ample.
fn stable_secret(data_dir: &Path) -> String {
    let file = data_dir.join(".jwt-secret");
    if let Ok(existing) = std::fs::read_to_string(&file) {
        if existing.trim().len() >= 32 {
            return existing.trim().to_string();
        }
    }
    let seed = format!(
        "{:?}-{}-{}",
        std::time::SystemTime::now(),
        std::process::id(),
        data_dir.display()
    );
    let mut hasher = DefaultHasher::new();
    seed.hash(&mut hasher);
    let secret = format!("openpath-local-{:016x}", hasher.finish());
    let _ = std::fs::write(&file, &secret);
    secret
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(Sidecar(Mutex::new(None)))
        .setup(|app| {
            let handle = app.handle();

            // Per-user data dir (OS-standard location, survives app updates).
            let data_dir = handle.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;

            // Resource dir holds the sidecar payload bundled via
            // tauri.conf -> bundle.resources (map form: "native/app" -> "app"):
            //   app/openpath/server/app.cjs   esbuild bundle of the Fastify server
            //   app/dist/web/**               the built SPA (server serves it)
            //   app/better-sqlite3/**         runtime subset of the native package
            // The server locates the SPA via path.join(__dirname, '..', '..',
            // 'dist', 'web') — the nested layout is deliberate; zero server changes.
            let app_root = handle.path().resolve("app", BaseDirectory::Resource)?;
            let server_entry = app_root.join("openpath").join("server").join("app.cjs");

            let port = free_port();

            let command = handle
                .shell()
                .sidecar("server")?
                .args([server_entry.to_string_lossy().to_string()])
                .env("NODE_ENV", "production")
                .env("PORT", port.to_string())
                .env(
                    "DATABASE_PATH",
                    data_dir.join("openpath.db").to_string_lossy().to_string(),
                )
                .env("OPENPATH_NATIVE_DIR", app_root.to_string_lossy().to_string())
                .env("JWT_SECRET", stable_secret(&data_dir))
                // Note: server seedIfEmpty() seeds the demo classrooms/accounts
                // (ROOM42, ada.lovelace@openpath.dev / teach1234, ...) into any
                // empty DB regardless of this flag — handy for a first desktop
                // run; wipe the DB file for a clean slate.
                .env("SEED_DEMO_DATA", "true");

            let (mut rx, child) = command.spawn()?;
            app.state::<Sidecar>().0.lock().unwrap().replace(child);

            // Surface sidecar logs to stderr (visible in a terminal dev run).
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stderr(line) = event {
                        eprintln!("[openpath-server] {}", String::from_utf8_lossy(&line));
                    }
                }
            });

            // Show the window only once the server answers — no white flash,
            // no race with the SPA's first API calls.
            let window = handle.get_webview_window("main");
            let url = format!("http://127.0.0.1:{port}/");
            std::thread::spawn(move || {
                if wait_ready(port, Duration::from_secs(60)) {
                    if let Some(window) = window {
                        if let Ok(url) = url.parse() {
                            let _ = window.navigate(url);
                        }
                    }
                } else {
                    eprintln!("OpenPath sidecar did not start within 60s");
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())?
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<Sidecar>() {
                    if let Some(child) = state.0.lock().unwrap().take() {
                        let _ = child.kill();
                    }
                }
            }
        });
}
