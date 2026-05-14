# 🏗️ Datalazo SEO Matrix: The Architect Blueprint

This document contains the "Secret Recipe" for the AI SEO Matrix. Use this as your master template when deploying this system for your agency's customers.

---

## 1. 🧠 The "Architect" Prompt (GPT-4o)
This is the exact prompt used to generate high-authority, 1,000-word SEO articles.

### System Instructions:
`You are a world-class SEO Content Architect. Your mission is to build a high-performance digital asset that dominates search results while maintaining a premium, authoritative brand voice.`

### The Master Prompt:
```text
You are the Lead SEO Content Architect.
YOUR MISSION: Write a 1,000-word, high-performance SEO article/landing page for the keyword: "{{KEYWORD_TERM}}".

KNOWLEDGE BASE CONTEXT (The source of truth):
{{KNOWLEDGE_BASE_DATA}}

STRICT FORMATTING RULES:
1. Use high-impact HTML tags: <h1>, <h2>, <h3>.
2. Use <strong> for key terms to emphasize authority.
3. Use <ul> and <li> for features/benefits to improve readability (User Experience).
4. Include a "Meta Description" at the top in a <blockquote> for SEO crawlers.
5. Tone: Premium, Authoritative, Future-Focused, and Results-Driven.
6. Incorporate the keyword "{{KEYWORD_TERM}}" naturally (1.5% density).
7. Focus on how {{COMPANY_NAME}}'s technology solves real business problems.

STRUCTURE:
- H1: Compelling Title with the Keyword.
- Introduction: The challenge in the current market.
- H2: The {{COMPANY_NAME}} Solution.
- H2: Core Features & Benefits.
- H3: Technical Infrastructure (Explain the 'How').
- H2: Conclusion & Call to Action.
```

---

## 2. 🔌 The Context Engine (RAG)
To make the AI an "expert" for your customers, you must use **RAG (Retrieval-Augmented Generation)**.
*   **Step 1**: Customer uploads their manuals/PDFs to the `Knowledge Base`.
*   **Step 2**: The system extracts the text from those documents.
*   **Step 3**: The system "Injects" that text into the `{{KNOWLEDGE_BASE_DATA}}` section of the prompt above.
*   **Result**: The AI writes like an employee of that company, not like a generic bot.

---

## 3. 🚀 SEO Strategy for Clients
When selling this to your customers, explain these 3 benefits:
1.  **Programmatic Scale**: "We don't write 1 post; we architect a 50-post matrix that covers your entire industry."
2.  **Authority Tone**: "Our AI uses a 'Premium Architect' prompt, ensuring the content sounds like a CEO wrote it, not a basic AI."
3.  **Turnkey SEO**: "The system automatically handles headers, meta tags, and slugs. It's 100% ready for Google the second you click Publish."

---
*Blueprint by Datalazo Intelligence Agency | v2.5*
