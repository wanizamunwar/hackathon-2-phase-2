# Evolution of Todo - Hackathon Project

## Overview
A 5-Phase "Evolution of Todo" Project using Claude Code and Spec-Kit Plus.

## Core Deliverables
1. **Spec-Driven Implementation**: Implement all 5 Phases using Spec-Driven Development. Write a Markdown Constitution and Spec for every feature, and use Claude Code to generate the implementation.
   - **Constraint**: Cannot write code manually. Must refine the Spec until Claude Code generates the correct output.
2. **Integrated AI Chatbot** (Phases III, IV, V): Conversational interface using OpenAI Chatkit, OpenAI Agents SDK, and Official MCP SDK. Bot must manage Todo list via natural language (e.g., "Reschedule my morning meetings to 2 PM").
3. **Cloud Native Deployment** (Phases IV, V): Deploy chatbot locally on Minikube, and on cloud on DigitalOcean Kubernetes (DOKS).

---

## Todo App Feature Progression

### Basic Level (Core Essentials)
- **Add Task** - Create new todo items
- **Delete Task** - Remove tasks from the list
- **Update Task** - Modify existing task details
- **View Task List** - Display all tasks
- **Mark as Complete** - Toggle task completion status

### Intermediate Level (Organization & Usability)
- **Priorities & Tags/Categories** - Assign levels (high/medium/low) or labels (work/home)
- **Search & Filter** - Search by keyword; filter by status, priority, or date
- **Sort Tasks** - Reorder by due date, priority, or alphabetically

### Advanced Level (Intelligent Features)
- **Recurring Tasks** - Auto-reschedule repeating tasks (e.g., "weekly meeting")
- **Due Dates & Time Reminders** - Set deadlines with date/time pickers; browser notifications
