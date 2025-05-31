# User Guide: CTF Write-up Builder

## What is CTF Write-up Builder?

CTF Write-up Builder is a web application that allows you to create, organize, and export write-ups (solutions) for CTF machines and challenges in a professional, fast, and secure way.  
It supports both English and Spanish, and is designed for the cybersecurity community.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Application Structure](#application-structure)
3. [Main Sections and Usage](#main-sections-and-usage)
4. [Import and Export Write-ups](#import-and-export-write-ups)
5. [Using AI (OpenAI/Gemini)](#using-ai-openai-gemini)
6. [Customization and Templates](#customization-and-templates)
7. [Language Management](#language-management)
8. [Security and Privacy Tips](#security-and-privacy-tips)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Getting Started

1. **Access the app:**  
   Open the application URL in your browser (e.g., the Vercel deployment).

2. **Select language:**  
   Choose between English and Spanish from the top menu or settings.

3. **Configure API Key (optional):**  
   If you want to use AI for automatic suggestions, configure your OpenAI or Gemini key in the settings section.

---

## Application Structure

- **Top Bar:**  
  Access to language, settings, import/export, and help.

- **Main Panel:**  
  Here you edit your write-up, add sections, images, and manage content.

- **Preview:**  
  You can see how your final write-up will look in real-time.

---

## Main Sections and Usage

### 1. **Title and Metadata**

- **Title:**  
  Write the name of the machine or challenge. Example: `HTB - Blue`
- **Author:**  
  Your name or alias.
- **Date:**  
  The date is automatically generated and **cannot be modified**. It always reflects the current date.
- **Difficulty, Operating System:**  
  Complete these fields for a professional write-up.

### 2. **Write-up Sections**

The app includes suggested templates (Reconnaissance, Exploitation, Post-Exploitation, etc.) and you can add, delete, or reorder sections as needed.

- **Add Section:**  
  Click "Add Section" and choose a name.
- **Edit Section:**  
  Click on the title or content to modify it.
- **Reorder Sections:**  
  Drag user sections to change their order (fixed templates cannot be moved).
- **Delete Section:**  
  Click the trash icon in the corresponding section.

### 3. **Images and Files**

- **Add Image:**  
  **IMPORTANT:** You can only add images to sections that you have edited or created. If you haven't modified a suggested template or added a section, you won't be able to upload images or modify the structure.
- **Visualization:**  
  Images are displayed in the preview and export.

### 4. **Notes and Tips**

- Use sections to document each phase of the challenge.
- You can copy/paste commands, terminal outputs, and results.

---

## Import and Export Write-ups

### **Import**

- **From JSON:**  
  Import a previously exported write-up from the app.
- **From Markdown:**  
  Import write-ups in Markdown format (.md). The app will try to map headers and sections automatically.
- **Import Options:**  
  You can choose to merge with your current write-up or replace it completely.

### **Export**

- **To PDF:**  
  Export your write-up in PDF format ready to share or submit.
- **To JSON:**  
  Save your progress to continue editing later.
- **To Markdown:**  
  Export content in Markdown format to share in forums or repositories.

---

## Using AI (OpenAI/Gemini)

- **Configure API Key:**  
  Go to settings and add your OpenAI or Gemini key.
- **Automatic Suggestions:**  
  In each section, you can ask the AI to help you write, summarize, or improve the text.
- **Privacy:**  
  Keys are stored locally and are never sent to external servers.

---

## Customization and Templates

- **Suggested Sections:**  
  You'll always have recommended section templates (Recon, Exploit, etc.).
- **Create Your Own Templates:**  
  You can add and save custom sections for future write-ups.

---

## Language Management

- **Change Language Anytime:**  
  Interface content and templates adapt automatically.
- **Warning:**  
  Changing language may reset the current write-up (a confirmation warning is shown).

---

## Security and Privacy Tips

- **All content is saved locally in your browser.**
- **No information is sent to external servers, except when using AI.**
- **API keys are protected and only used on your device.**
- **Don't upload sensitive or private information if you plan to share the write-up.**

---

## Frequently Asked Questions

**Can I use the app offline?**  
Yes, but some features (like AI) require internet.

**Can I share my write-ups?**  
Yes, export to PDF, Markdown, or JSON and share them as you prefer.

**What happens if I close the app?**  
Your progress is saved locally, but export regularly to avoid losses.

**Can I collaborate with others?**  
For now, editing is individual, but you can share exported files.

---

## Support and Contact

- **Questions or suggestions?**  
  Check the documentation, review help files, or contact the team at:  
  **writeup_builder@proton.me**

---

Need the guide in Spanish or a PDF/visual manual? Just let me know! 