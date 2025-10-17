# Cybersecurity Threat Intelligence Dashboard

**Author:** Jouni Mikkola

> **⚠️ IMPORTANT:** This repository contains **only the frontend dashboard** for visualizing cybersecurity threat intelligence data. The RSS feed collection, language model processing, and data enrichment happen **externally**. This repository serves as a static GitHub Pages site to display pre-processed JSON data.

A static cybersecurity threat intelligence dashboard hosted on GitHub Pages that displays processed threat data from RSS feeds and intelligence sources. This is a **frontend-only visualization** of pre-processed security data.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-brightgreen) ![GitHub Pages](https://img.shields.io/badge/Deployment-GHub%20Pages-blue) ![Vue.js](https://img.shields.io/badge/Framework-Vue.js-4FC08D) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Overview

This dashboard provides a **read-only visualization** of cybersecurity threat intelligence data that has been **pre-processed** from RSS feeds and enriched using language models. **Note:** This repository contains only the frontend dashboard - the data processing and RSS feed collection happen separately and the resulting JSON files are committed to this repository for display.

## ✨ Key Features

### 📊 **Real-time Intelligence**
- **Live threat monitoring** from multiple RSS feeds
- **Automated data enrichment** using language models
- **Executive summaries** for quick decision-making
- **7-day, 30-day, and 150-day trend analysis**

### 🎨 **Interactive Visualizations**
- **Dynamic charts** for threat trends and patterns
- **Geographic threat distribution** mapping
- **Vulnerability severity analysis** (CVSS scores)
- **Threat actor motivation and attribution**

### 🔍 **Comprehensive Data Views**
- **Security Incidents** - Real-time incident tracking and analysis
- **Vulnerabilities** - CVE database with severity assessment
- **Threat Actors** - Actor profiles, motivations, and TTPs
- **Analytics Dashboard** - Advanced threat intelligence analytics

### 📱 **Responsive Design**
- **Mobile-friendly** interface
- **Cross-browser compatibility**
- **Progressive Web App** capabilities

## 🏗️ Architecture

### **Data Pipeline (External Processing)**
```
RSS Feeds → Language Model Enrichment → JSON Files → Dashboard Visualization
```

**This repository only contains the final stage:**
- **RSS Feed Collection**: Happens externally (not in this repo)
- **AI-Powered Enrichment**: Happens externally (not in this repo)  
- **Static JSON Files**: Generated externally and committed to this repo
- **Dashboard Rendering**: ✅ This is what this repository provides

### **What This Repository Contains**
- **Frontend Dashboard**: Vue.js 3 application for data visualization
- **Static Assets**: CSS, JavaScript components, and libraries
- **Pre-processed Data**: JSON files with threat intelligence data
- **GitHub Pages Configuration**: Static site deployment setup

### **What This Repository Does NOT Contain**
- ❌ RSS feed collection code
- ❌ Language model processing scripts
- ❌ Data enrichment pipeline
- ❌ Backend servers or APIs
- ❌ Database connections

### **Technology Stack**
- **Frontend**: Vue.js 3, Bootstrap 5, Chart.js
- **Deployment**: GitHub Pages (static hosting only)
- **Data Format**: JSON (static files, updated via commits)

## 🚀 Quick Start

### **View Live Dashboard**
Visit the deployed dashboard at:
```
https://tidashboar.github.io
```

## 📁 Project Structure

```
tidashboar.github.io/
├── index.html                    # Main dashboard entry point
├── gui/                          # Static JSON data files
│   ├── latest_summary.json       # Executive summary and stats
│   ├── dashboard.json            # Dashboard metadata
│   ├── incidents.json            # Security incidents data
│   ├── vulnerabilities.json      # CVE vulnerability data
│   ├── threat_actors.json        # Threat actor intelligence
│   └── statistics.json           # Analytics and trends
├── static/                       # Static assets
│   ├── css/dashboard.css         # Custom styles
│   └── js/                       # JavaScript components
│       ├── app.js                # Main Vue.js application
│       ├── services/             # Data services
│       └── components/           # Vue components
└── README.md                     # This file
```

## 🎛️ Dashboard Sections

### **Executive Summary**
- High-level threat landscape overview
- Key metrics and trends
- Critical incidents and vulnerabilities
- Risk assessment indicators

### **Security Incidents**
- Real-time incident tracking
- Severity-based filtering
- Search and categorization
- Timeline analysis

### **Vulnerabilities**
- CVE database with CVSS scores
- Vendor and product filtering
- Exploit availability tracking
- Risk-based prioritization

### **Threat Actors**
- Actor profiles and attributions
- Motivation and capability analysis
- Geographic distribution
- Malware family associations

### **Analytics Dashboard**
- Trend analysis and forecasting
- Statistical correlations
- Risk assessment metrics
- Customizable visualizations

## ⚙️ Data Sources & Processing

### **Important Note About Data Processing**
**This dashboard does not process data directly.** The RSS feed collection and language model enrichment happen **externally** to this repository. The processed results are then committed as JSON files to the `gui/` folder.

### **RSS Feed Sources (External)**
The displayed data originates from multiple cybersecurity RSS feeds including:
- National vulnerability databases
- Security vendor threat feeds  
- Industry-specific intelligence sources
- Government security alerts
- Research institution publications

### **Language Model Enrichment (External)**
Raw RSS feed data is processed and enriched using language models to:
- **Extract key entities** (threat actors, vulnerabilities, affected systems)
- **Generate executive summaries** for quick comprehension
- **Classify incidents** by type, severity, and industry impact
- **Identify patterns** and correlations across multiple sources
- **Translate technical content** into business-relevant insights

### **Data Update Process**
1. **External pipeline** processes RSS feeds and enriches data
2. **JSON files** are generated with processed intelligence
3. **Files are committed** to this repository's `gui/` folder
4. **GitHub Pages** automatically serves updated files
5. **Dashboard displays** latest committed data


## ⚠️ Important Disclaimer

### **AI-Generated Content Notice**
This dashboard utilizes language models to process and enrich cybersecurity data from RSS feeds. **Users should be aware of the following limitations:**

#### **Potential Hallucinations**
- Language models may occasionally generate **inaccurate or fabricated information**
- **Attribution details** (threat actors, motivations) may be inferred rather than confirmed
- **Impact assessments** may contain speculative elements
- **Technical details** might be simplified or misinterpreted

#### **Data Accuracy Limitations**
- **RSS feed sources** vary in reliability and accuracy
- **Information may be outdated** by the time it reaches the dashboard
- **Translation and summarization** may lose important context
- **Automated processing** cannot replace human analysis

#### **Recommended Usage**
- **Use as a starting point** for threat intelligence research
- **Verify critical information** through primary sources
- **Cross-reference important findings** with official security advisories
- **Consult human security analysts** for critical decision-making
- **Do not rely solely** on this dashboard for security operations

#### **No Warranty**
This dashboard is provided **"as-is"** without warranties of any kind. The author and contributors assume **no liability** for decisions made based on the information presented.

## 🔧 Customization

### **Dashboard Customization (This Repository)**
You can modify the dashboard appearance and behavior:

#### **Visual Customizations**
- Modify Chart.js configurations in `static/js/services/charts.js`
- Update Vue components in `static/js/components/`
- Add new CSS styles in `static/css/dashboard.css`
- Update colors and branding in `index.html`

#### **Data Structure Changes**
- Modify how JSON data is displayed in components
- Add new visualization types
- Change filtering and search behavior

### **Data Source Updates (External)**
**This repository cannot add new RSS feeds or modify data processing.** To change data sources:
1. **External pipeline** must be modified (not in this repo). This pipeline is not released to the public.
2. **New JSON files** must be generated with updated structure
3. **Files must be committed** to this repository
4. **Dashboard components** may need updates to handle new data structure


### **Limitations**
- ❌ Cannot add RSS feeds through this repository
- ❌ Cannot modify language model processing here
- ❌ Cannot change data enrichment logic
- ✅ Can modify visualization and presentation
- ✅ Can update styling and branding
- ✅ Can add new chart types and filters

## 📊 Data Privacy

- **No personal data** is collected or stored by this dashboard
- **All data processing** happens externally before JSON files are created
- **Dashboard runs entirely in the browser** after initial page load
- **No tracking or analytics** embedded in the application
- **All data displayed** is publicly available from RSS sources


## 🙏 Acknowledgments

- **RSS feed providers** for making threat intelligence publicly available
- **Language model providers** for enabling data enrichment capabilities
- **Open source community** for the amazing tools and frameworks used
- **Cybersecurity community** for continuous threat intelligence sharing

---

**⚠️ Remember:** This tool is designed to **augment** human threat intelligence analysis, not replace it. Always verify critical information through multiple sources and consult with security professionals for important decisions.