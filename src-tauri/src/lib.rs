use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct SyncProgress {
    total: u32,
    completed: u32,
    current_item: String,
    is_complete: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OfflineIndex {
    entries: HashMap<String, String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[tauri::command]
async fn download_and_store_content(app: AppHandle, urls: Vec<String>) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let offline_dir = app_data_dir.join("offline_content");
    fs::create_dir_all(&offline_dir)
        .map_err(|e| format!("Failed to create offline directory: {e}"))?;

    let mut index = OfflineIndex {
        entries: HashMap::new(),
    };

    // Load existing index if it exists
    let index_path = offline_dir.join("index.json");
    if index_path.exists() {
        if let Ok(index_content) = fs::read_to_string(&index_path) {
            if let Ok(existing_index) = serde_json::from_str::<OfflineIndex>(&index_content) {
                index = existing_index;
            }
        }
    }

    let client = reqwest::Client::new();
    let total = urls.len() as u32;

    for (i, url) in urls.iter().enumerate() {
        // Emit progress update
        let progress = SyncProgress {
            total,
            completed: i as u32,
            current_item: url.clone(),
            is_complete: false,
        };
        let _ = app.emit("sync-progress", &progress);

        // Generate a safe filename from the URL
        let filename = url_to_filename(url);
        let file_path = offline_dir.join(&filename);

        // Download content with proper headers to get the full page
        let mut request = client.get(url);
        request = request.header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
        request = request.header(
            "Accept",
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        );
        request = request.header("Accept-Language", "en-US,en;q=0.5");
        request = request.header("Connection", "keep-alive");
        request = request.header("Upgrade-Insecure-Requests", "1");

        match request.send().await {
            Ok(response) => {
                if response.status().is_success() {
                    match response.text().await {
                        Ok(content) => {
                            // Try to extract the main content from the page
                            let processed_content = process_html_content(&content, url);

                            if let Err(e) = fs::write(&file_path, processed_content) {
                                eprintln!("Failed to write file {filename}: {e}");
                                continue;
                            }
                            // Update index
                            index.entries.insert(url.clone(), filename);
                        }
                        Err(e) => {
                            eprintln!("Failed to read response for {url}: {e}");
                            continue;
                        }
                    }
                } else {
                    eprintln!("HTTP error for {}: {}", url, response.status());
                    continue;
                }
            }
            Err(e) => {
                eprintln!("Failed to download {url}: {e}");
                continue;
            }
        }
    }

    // Save updated index
    let index_json = serde_json::to_string_pretty(&index)
        .map_err(|e| format!("Failed to serialize index: {e}"))?;
    fs::write(&index_path, index_json).map_err(|e| format!("Failed to write index: {e}"))?;

    // Emit completion
    let final_progress = SyncProgress {
        total,
        completed: total,
        current_item: "Complete".to_string(),
        is_complete: true,
    };
    let _ = app.emit("sync-progress", &final_progress);

    Ok(())
}

#[tauri::command]
async fn get_offline_content(app: AppHandle, url: String) -> Result<bool, String> {
    println!("get_offline_content called for URL: {}", url);

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let offline_dir = app_data_dir.join("offline_content");
    let index_path = offline_dir.join("index.json");

    println!("Offline directory: {:?}", offline_dir);
    println!("Index path: {:?}", index_path);

    if !index_path.exists() {
        println!("Index file does not exist");
        return Ok(false);
    }

    let index_content =
        fs::read_to_string(&index_path).map_err(|e| format!("Failed to read index: {e}"))?;

    let index: OfflineIndex =
        serde_json::from_str(&index_content).map_err(|e| format!("Failed to parse index: {e}"))?;

    println!("Index entries count: {}", index.entries.len());
    println!("Looking for URL: {}", url);

    if let Some(filename) = index.entries.get(&url) {
        println!("Found filename in index: {}", filename);
        let file_path = offline_dir.join(filename);
        println!("File path: {:?}", file_path);

        if file_path.exists() {
            println!("File exists, reading content...");
            let content = fs::read_to_string(file_path)
                .map_err(|e| format!("Failed to read offline content: {e}"))?;
            println!("Content length: {}", content.len());

            // Store the content temporarily and emit an event to the main window
            let _ = app.emit("offline-content-available", &content);

            return Ok(true);
        } else {
            println!("File does not exist");
        }
    } else {
        println!("URL not found in index");
    }

    Ok(false)
}

#[tauri::command]
async fn get_offline_content_raw(app: AppHandle, url: String) -> Result<Option<String>, String> {
    println!("get_offline_content_raw called for URL: {}", url);

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let offline_dir = app_data_dir.join("offline_content");
    let index_path = offline_dir.join("index.json");

    if !index_path.exists() {
        return Ok(None);
    }

    let index_content =
        fs::read_to_string(&index_path).map_err(|e| format!("Failed to read index: {e}"))?;

    let index: OfflineIndex =
        serde_json::from_str(&index_content).map_err(|e| format!("Failed to parse index: {e}"))?;

    if let Some(filename) = index.entries.get(&url) {
        let file_path = offline_dir.join(filename);

        if file_path.exists() {
            let content = fs::read_to_string(file_path)
                .map_err(|e| format!("Failed to read offline content: {e}"))?;
            return Ok(Some(content));
        }
    }

    Ok(None)
}

#[tauri::command]
async fn check_offline_availability(
    app: AppHandle,
    urls: Vec<String>,
) -> Result<Vec<bool>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let offline_dir = app_data_dir.join("offline_content");
    let index_path = offline_dir.join("index.json");

    if !index_path.exists() {
        return Ok(vec![false; urls.len()]);
    }

    let index_content =
        fs::read_to_string(&index_path).map_err(|e| format!("Failed to read index: {e}"))?;

    let index: OfflineIndex =
        serde_json::from_str(&index_content).map_err(|e| format!("Failed to parse index: {e}"))?;

    let availability: Vec<bool> = urls
        .iter()
        .map(|url| {
            if let Some(filename) = index.entries.get(url) {
                let file_path = offline_dir.join(filename);
                file_path.exists()
            } else {
                false
            }
        })
        .collect();

    Ok(availability)
}

fn process_html_content(html_content: &str, url: &str) -> String {
    // Parse the HTML content
    let document = Html::parse_document(html_content);

    // Try to extract the main content area
    let main_content_selectors = vec![
        "main",
        ".main-content",
        "#main-content",
        ".content",
        "#content",
        "article",
        ".technique-content",
        ".tactic-content",
    ];

    let mut processed_content = String::new();

    // Try to find the main content using different selectors
    for selector_str in main_content_selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            if let Some(main_element) = document.select(&selector).next() {
                // Found main content, extract it
                processed_content = format!(
                    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MITRE ATT&CK - Offline Content</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; margin-top: 6px }}
        h1, h2, h3 {{ color: #333; }}
        .original-url {{ color: #666; font-size: 0.9em; margin-bottom: 6px; }}
    </style>
</head>
<body>
    <div class="original-url">
        <strong>Original URL:</strong> <a href="{}" target="_blank">{}</a>
    </div>
    {}
</body>
</html>"#,
                    url,
                    url,
                    main_element.inner_html()
                );
                break;
            }
        }
    }

    // If no main content found, return the original content with offline notice
    if processed_content.is_empty() {
        processed_content = format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MITRE ATT&CK - Offline Content</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; margin-top: 6px }}
        h1, h2, h3 {{ color: #333; }}
        .original-url {{ color: #666; font-size: 0.9em; margin-bottom: 6px; }}
    </style>
</head>
<body>
    <div class="original-url">
        <strong>Original URL:</strong> <a href="{}" target="_blank">{}</a>
    </div>
    {}
</body>
</html>"#,
            url, url, html_content
        );
    }

    processed_content
}

fn url_to_filename(url: &str) -> String {
    // Create a safe filename from URL
    let mut filename = url.replace(['/', ':', '?', '&', '='], "_");
    filename = filename.replace("https_", "").replace("http_", "");
    if filename.len() > 200 {
        filename.truncate(200);
    }
    format!("{filename}.html")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            download_and_store_content,
            get_offline_content,
            get_offline_content_raw,
            check_offline_availability
        ])
        .setup(|_app| {
            // Window is already configured via tauri.conf.json for native behavior
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
