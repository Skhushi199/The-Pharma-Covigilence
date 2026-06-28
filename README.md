# 🛡️ PharmaVigil
> A Next-Generation, Data-Driven Pharmacovigilance Platform

![PharmaVigil Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?logo=mongodb)
![AI](https://img.shields.io/badge/AI-Hugging_Face_SapBERT-orange?logo=huggingface)

PharmaVigil is a comprehensive, full-stack Pharmacovigilance platform built to modernize how Adverse Drug Reactions (ADRs) are reported and analyzed. Traditional drug safety monitoring relies on complex, tedious manual forms that discourage patient participation and slow down critical safety analysis. 

This project bridges the gap between everyday patients and pharmacovigilance experts by introducing an **interactive, chat-based reporting flow** that feels natural and takes only minutes to complete. Behind the scenes, the platform leverages advanced Artificial Intelligence (the Hugging Face Inference API via SapBERT) to automatically map raw, unstructured patient descriptions into standardized **MedDRA** (Medical Dictionary for Regulatory Activities) terminology. 

For administrators and drug safety authorities, PharmaVigil provides a powerful, real-time analytics dashboard. It instantly calculates causality using the **Naranjo Algorithm** and actively runs signal detection algorithms, calculating the **Proportional Reporting Ratio (PRR)** to flag statistically significant adverse events before they become widespread crises.

## ✨ Features

### For Patients
- **Intelligent Symptom Reporting:** Interactive, chat-based flow for reporting ADRs in under 3 minutes.
- **Personalized Dashboard:** Track all submitted reports, causality results, and severity scores securely.
- **Automated Causality Assessment:** Utilizes the built-in Naranjo Algorithm to score adverse reactions instantly.

### For Administrators
- **Real-Time Analytics Dashboard:** Monitor drug safety signals, track high-severity cases, and view global statistics.
- **AI MedDRA Mapping:** Integrates the Hugging Face Inference API (SapBERT) to automatically map raw, unstructured patient symptoms to standardized MedDRA medical terminology.
- **Signal Detection Engine:** Computes the Proportional Reporting Ratio (PRR) dynamically to flag potential unknown side effects for specific drugs.

## 🏗️ Architecture

PharmaVigil uses a decoupled architecture for maximum scalability:
- **Client (`/client`):** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Zustand, Axios.
- **Server (`/server`):** Node.js, Express, MongoDB (Mongoose), JWT Auth, Hugging Face API Integration.

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) or local MongoDB instance
- [Hugging Face Access Token](https://huggingface.co/settings/tokens)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/pharmacovigilance-app.git
cd pharmacovigilance-app
