# Team Project

# 🤖 IT Asset Repository System with Custom Chatbot

A web-based platform for managing and organizing IT assets — featuring a **built-in AI-powered chatbot** that assists users in generating, exploring, and understanding assets.  
Developed as part of a **Software Engineering team project** at **Royal Holloway, University of London**.

---

## 🧠 Overview
The **IT Asset Repository System** serves as a collaborative environment where users can upload, track, and manage IT assets along with their metadata.  
Each asset is linked to a project, and users can explore relationships, discuss ideas, and even generate assets through the integrated chatbot.

---

## 🎬 Demo Video
🎥 **Watch on YouTube:** [Click here to view the demo](https://youtu.be/rGM3N7e14JA)  


---

## 🚀 Key Features
- 🤖 **AI Chatbot Integration** — Generate assets, explore data, and get insights directly through an interactive chatbot  
- 📦 **Asset Management** — Upload, view, and classify assets with metadata  
- 🔗 **Project Linking** — Associate assets with specific projects (`project_id`)  
- 💬 **Discussion Board** *(Extension)* — Collaborate with other users to evaluate and discuss assets  
- 🔍 **Search Functionality** — Quickly locate assets through smart search and filtering  
- 🧩 **Relation Mapping** — Visualize connections and dependencies between assets  
- 🧾 **Automated Logging** — Track user activity and system updates for admin review  
- 👥 **User Roles & Permissions** — Manage privileges for secure and structured collaboration  
- 📄 **External Document Linking** — Store documents as external files for simplified versioning  
- 🧱 **Asset Typing** — Classify assets by type for organized browsing  

---

## ✅ Implemented User Stories
- [x] **As a User**, I can use a discussion board to communicate with others  
- [x] **As a User**, I can identify which projects an asset is used in  
- [x] **As an Administrator**, I can review logs for all updates  
- [x] **As a User**, I can view relationships between assets  
- [x] **As a User**, I can search the repository to find assets  
- [x] **As an Administrator**, I can restrict privileges based on roles  
- [x] **As an Administrator**, I can ensure documents are linked externally  
- [x] **As a User**, I can associate assets with a type  
- [x] **As a User**, I can associate assets with each other  
- [x] **[Extension]** Custom chatbot for automated asset generation and repository assistance  

---

## 🧰 Tech Stack
| Category | Tools / Frameworks |
|-----------|--------------------|
| Frontend | HTML, CSS, Svelte |
| Backend | PocketBase |
| Version Control | GitLab |
| Collaboration | Agile workflow (Scrum) |
| Extension | Custom AI Chatbot |

---

## 👥 Teamwork & My Role
Developed collaboratively as a team project.  
My primary contributions included:
- Designing and implementing the **PocketBase schema** for assets and projects  
- Creating backend scripts for **automatic metadata updates** and **logging**  
- Developing and integrating the **AI-powered chatbot**  
- Linking backend logic with the **Svelte frontend**  
- Testing and refining features related to **metadata, permissions, and search**

---


## 📸 Screenshots



---


# Running the back-end

```bash
# Move into the Back-end Folder
cd backend
```

```bash
# start a development server
./pocktetbase[Env] serve
```
Log in with:
Email: Super.user@pocketbase.com
Password: SuperPassword

# Running the Front-end

```bash
# Move into the Frontend Folder
cd frontend
```

```bash
# install the dependencies
npm install
```

```bash
# install the openai for the chatbot
npm install openai
```

```bash
# start a development server
npm run dev
```













