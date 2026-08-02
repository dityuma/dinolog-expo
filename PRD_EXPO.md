# DinoLog v6.0 — Product Requirements Document

**Version:** 6.0  
**Status:** Current Release  
**Last Updated:** Juni 2025  

## Executive Summary
**DinoLog** is a specialized, offline-first companion application designed for reptile keepers (particularly tortoise enthusiasts) to meticulously document every aspect of their pets' lives. From health metrics and growth tracking to medical history and hibernation (brumation) phases, DinoLog provides a comprehensive local database for pet care management.

---

## 1. Feature Roadmap & Current Status

### 1.1 Core Management
*   **Multi-Pet Profiles**: Support for multiple reptiles with detailed profiles (Name, Species, Gender, Birth Date, Adoption Date).
*   **Dynamic Age Calculation**: Real-time age display in years, months, and days.
*   **Media Management**: Local internal storage for profile photos and log documentation.

### 1.2 Specialized Log Modules (Full CRUD)
*   **Growth Tracking**: 
    *   Logs for Weight (grams) and Length (cm).
    *   Up to 4 high-resolution photos per entry.
    *   **Analytics**: Dual-axis line charts (Vico) to visualize development trends.
*   **Nutritional Monitoring**: 
    *   Feeding logs with food types, amounts, and frequency.
    *   Preset suggestions for common tortoise diets.
*   **Health & Medical (Riwayat Sakit)**:
    *   Document illnesses with start/end dates and "Ongoing" status.
    *   Visual proof through photos to monitor healing progress.
*   **Shell/Scute Monitoring**:
    *   Tracking carapace conditions (Piramiding, Soft Shell, Jamur).
    *   Educational warning cards for critical conditions requiring vet attention.
*   **Brumation (Hibernation)**:
    *   Start/End date tracking.
    *   Weight monitoring before and after brumation to ensure health safety.

### 1.3 Personalization & Data Portability
*   **Turtle-Themed Preferences**: 8 distinct UI themes including *Sulcata Desert*, *Aldabra Giant*, *Radiata Starburst*, and *Cherry Head*.
*   **JSON Portability**: Full Export and Import functionality via the public Downloads folder, allowing easy backup and data migration between devices without cloud dependency.

---

## 2. Technical Stack

| Category | Technology |
|---|---|
| **Architecture** | MVVM + Repository Pattern |
| **Language** | Kotlin 2.2.10 |
| **UI** | Jetpack Compose (Material 3) |
| **Persistence** | Room Database (Schema v7) |
| **Networking/Serialization** | Gson (for JSON backups) |
| **Charts** | Vico (Compose integration) |
| **Image Loading** | Coil |
| **Min SDK** | 26 (Android 8.0) |
| **Target SDK** | 35 (Android 15) |

---

## 3. Business & Technical Rules

1.  **Privacy Priority**: Zero cloud sync. All data, including high-res photos, remains strictly on the user's device.
2.  **Data Integrity**: Cascade deletion ensures that removing a pet profile cleanly wipes all associated logs and photo files from storage.
3.  **Performance**: Image compression and caching (Coil) used for smooth scrolling in long lists of logs.
4.  **No Feedback Interruption**: (New in v6.0) Removed intrusive Snakbars to provide a faster, more streamlined navigation experience.

---

## 4. UI/UX Principles

*   **Offline-First**: Every feature must work without an internet connection.
*   **Tabbed Organization**: Log categories are separated into clear tabs (Tumbuh, Makan, Karapas, Riwayat, Brumasi) for quick navigation.
*   **Visual-Heavy**: Heavy use of photos and charts to provide an at-a-glance health overview.

---

## 5. Future Development (Roadmap v7.0)

*   **PDF Report Generation**: Exporting health summaries as PDF documents for veterinary consultations.
*   **Proactive Notifications**: Reminders for supplements, UVB bulb changes, and scheduled vet visits.
*   **Species-Specific Presets**: Optimized temperature and diet recommendations based on selected species.
*   **Advanced Image Comparison**: Split-screen view to compare current shell/growth photos with past entries.
