<div align="center">

# 🛡️ MITRE ATT&CK Navigator

### Native Desktop Application with Offline Support

<p align="center">
  <img src="https://img.shields.io/badge/Built_with-Tauri-blue?style=for-the-badge&logo=tauri" alt="Built with Tauri">
  <img src="https://img.shields.io/badge/Frontend-Angular-red?style=for-the-badge&logo=angular" alt="Angular Frontend">
  <img src="https://img.shields.io/badge/STIX-2.0%20%7C%202.1-green?style=for-the-badge" alt="STIX Support">
  <img src="https://img.shields.io/badge/Platform-Cross--Platform-lightgrey?style=for-the-badge" alt="Cross Platform">
</p>

<p align="center">
  <strong>🔗 <a href="https://github.com/Athena-OS/mitre-attack-navigator/releases">Download Latest Release</a></strong>
</p>

</div>

---

## 📖 Overview

This is a **native desktop application** built with **Tauri** and **Angular**, based on the [Official MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator). It provides **complete offline support** for both [STIX 2.0](https://github.com/mitre/cti) and [STIX 2.1](https://github.com/mitre-attack/attack-stix-data) datasets.

> 💡 The datasets are included as submodules to ensure we can keep the data up-to-date in the future.

## ✨ Features

- 🖥️ **Native Desktop Experience** - Built with Tauri for performance and security
- 📱 **Cross-Platform** - Runs on Windows, macOS, and Linux
- 🔌 **Offline Support** - Complete functionality without internet connection
- 📊 **STIX 2.0 & 2.1 Support** - Latest MITRE ATT&CK data formats
- 🎨 **Modern UI** - Clean Angular-based interface
- 🔄 **Auto-Updates** - Easy dataset synchronization

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or later)
- **npm** or **yarn**
- **Rust** (for Tauri development)
- **webkit2gtk**

### 📥 Installation

**Option 1: Download Binary (Recommended)**

📦 **[Download the latest release](https://github.com/Athena-OS/mitre-attack-navigator/releases)** for your platform.

**Option 2: Build from Source**

1. **Clone the repository with submodules:**

    ```bash
    git clone https://github.com/Athena-OS/mitre-attack-navigator.git --recursive
    cd mitre-attack-navigator
    ```

2. **Install dependencies:**
    The following building dependencies are needed:
    ```
    cargo
    npm
    pkg-config
    ```

    The following runtime dependency is needed:
    ```
    webkit2gtk
    ```

    Then, run
    ```bash
    npm install
    ```

3. **Run in development mode:**

    ```bash
    npm run tauri dev
    ```

4. **Build for production:**
    ```bash
    npm run tauri build
    ```
    if you want to get AppImage, .deb and .rpm files, and the binary or

    ```bash
    npm run tauri build -- --no-bundle
    ```
    to get only the binary.

## 🔄 Keeping Data Up-to-Date

To sync the latest MITRE ATT&CK datasets:

```bash
git pull
git submodule update --recursive --remote
```
<br>

## Learn How ATT&CK Navigator Works

[![Watch the video](https://img.youtube.com/vi/hN_r3JW6xsY/0.jpg)](https://www.youtube.com/watch?v=hN_r3JW6xsY)
<br>
<br>

## About the MITRE ATT&CK® Framework

The MITRE ATT&CK® framework is a publicly accessible knowledge base describing adversary tactics, techniques, and procedures (TTPs) observed in real-world cyber incidents and attributed threat groups. Developed by The MITRE Corporation, it is designed to improve understanding of how cyber attacks are carried out, enabling both defensive and offensive security teams to better prepare for and respond to threats.

- **Meaning of ATT&CK:** The name stands for *Adversarial Tactics, Techniques, and Common Knowledge*.
- **Purpose and Scope:** ATT&CK acts as a reference model for classifying and analyzing adversary behavior, mapping out the phases of an attack lifecycle and identifying the tools, platforms, and operating systems targeted.
- **Use Cases:**
  - **Offensive Security & Adversary Simulation**
    - **Red Teams / Penetration Testers** – create realistic attack scenarios to test defenses.
    - **Adversary Emulation** – replicate known threat actor TTPs for security testing.
    - **Purple Teams** – collaborate across offensive and defensive teams to improve detection and mitigation.
  - **Defensive Operations**
    - **Blue Teams / SOC Analysts** – detect, investigate, and respond to attacks using ATT&CK mappings.
    - **Threat Hunters** – proactively search for attacker activity aligned to specific techniques.
    - **Incident Responders** – map attacker actions to ATT&CK for better incident analysis.
  - **Cyber Threat Intelligence (CTI)**
    - **Threat Actor Profiling** – associate known TTPs with specific APT groups.
    - **Campaign Analysis** – track and compare attacker behaviors over time.
    - **Threat Modeling** – prioritize defenses based on adversary capabilities and patterns.
  - **Security Architecture & Risk Management**
    - **Gap Analysis** – identify where security controls do not cover certain ATT&CK techniques.
    - **Security Control Mapping** – align EDR, firewall, and detection capabilities to specific techniques.
    - **Risk Assessment** – measure exposure to techniques most relevant to your industry.
  - **Training & Education**
    - **Security Awareness Training** – explain attack methods in a structured, relatable way.
    - **SOC Analyst Training** – practice detecting and responding to techniques in lab environments.
    - **University / Research Programs** – study attacker methodology for academic purposes.
  - **Tool & Product Evaluation**
    - **Security Product Benchmarking** – evaluate tools (e.g., EDR, IDS) against known ATT&CK techniques.
    - **MITRE ATT&CK Evaluations Participation** – test vendor products in simulated threat scenarios.
    - **Automation** – integrate ATT&CK mappings into dashboards, SIEMs, and threat intelligence platforms.
  - **Policy, Compliance & Reporting**
    - **Executive Reporting** – communicate security posture in business terms using ATT&CK categories.
    - **Regulatory Alignment** – map ATT&CK to frameworks like NIST, ISO 27001, or CIS Controls.
    - **Post-incident Lessons Learned** – report incidents using standardized ATT&CK terminology.


## Tactics, Techniques & Procedures (TTPs)

- **Tactics** define the adversary’s tactical objectives — the “why” behind each step of their attack methodology.
- **Techniques** explain “how” those tactical objectives are achieved.
- **Sub-techniques** give detailed descriptions of specific variations of a technique.
- **Procedures** document real-world examples of how a technique or sub-technique has been executed.


## Why ATT&CK?

- Provides a shared, standardized reference for adversary behavior based on real-world attack analysis and threat campaigns.
- Organizes and contextualizes adversary actions across the full attack lifecycle.
- Uses consistent terminology when describing TTPs and APT groups.
- Is continuously updated to reflect evolving threats and new intelligence.

---

*ATT&CK® is a registered trademark of The MITRE Corporation.*
