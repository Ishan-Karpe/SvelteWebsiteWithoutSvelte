async function generateGeminiContent(prompt) {
  // API key is now securely stored on the server side
  const apiUrl = '/api/generate';

  const payload = {
    prompt: prompt
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      // Enhanced markdown-to-html conversion
      let text = result.candidates[0].content.parts[0].text;
      text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // Bold
      text = text.replace(
        /`([^`]+)`/g,
        '<code class="px-1 py-0.5 text-orange-400 bg-gray-800 rounded">$1</code>'
      ); // Inline code
      text = text.replace(/\n/g, "<br>"); // Newlines
      return text;
    } else {
      return "Sorry, I couldn't generate an explanation right now.";
    }
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "An error occurred while fetching the explanation.";
  }
}

// UI Logic
document.addEventListener("DOMContentLoaded", () => {
  // for mobile
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileMenuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  //AI for FAQ
  const faqContainer = document.getElementById("faq-container");
  faqContainer.addEventListener("click", async (e) => {
    const questionButton = e.target.closest(".faq-question");
    if (!questionButton) return;

    const group = questionButton.parentElement;
    const answerWrapper = questionButton.nextElementSibling;
    const answerContent = answerWrapper.querySelector(".answer-content");
    const isOpen = group.getAttribute("data-open") === "true";

    //close all open FAQs
    faqContainer.querySelectorAll(".group").forEach((otherGroup) => {
      if (
        otherGroup !== group &&
        otherGroup.getAttribute("data-open") === "true"
      ) {
        otherGroup.setAttribute("data-open", "false");
        otherGroup.querySelector(".faq-answer").classList.add("hidden");
      }
    });

    //toggle current
    group.setAttribute("data-open", !isOpen);
    answerWrapper.classList.toggle("hidden");

    // fetch content if opening and not already fetched
    if (!isOpen && !answerContent.innerHTML.trim()) {
      answerContent.innerHTML =
        '<div class="flex items-center gap-2"><div class="loader"></div><span>Generating answer...</span></div>';
      const basePrompt = questionButton.querySelector("span").dataset.prompt;
      const prompt = `${basePrompt} Please answer in exactly 2 concise sentences. Use inline code formatting with backticks for technical terms.`;
      const explanation = await generateGeminiContent(prompt);
      answerContent.innerHTML = explanation;
    }
  });

  //AI Code explainer modal
  const modal = document.getElementById("ai-modal");
  const modalBackdrop = document.getElementById("ai-modal-backdrop");
  const modalPanel = document.getElementById("ai-modal-panel");
  const modalContent = document.getElementById("modal-content");
  const closeModalBtn = document.getElementById("close-modal-btn");

  const openModal = () => {
    modal.classList.remove("hidden");
    setTimeout(() => {
      modalBackdrop.classList.remove("opacity-0");
      modalPanel.classList.remove(
        "opacity-0",
        "translate-y-4",
        "sm:translate-y-0",
        "sm:scale-95"
      );
      modalBackdrop.classList.add("opacity-100");
      modalPanel.classList.add("opacity-100", "translate-y-0", "sm:scale-100");
    }, 10);
  };

  const closeModal = () => {
    modalBackdrop.classList.remove("opacity-100");
    modalPanel.classList.remove("opacity-100", "translate-y-0", "sm:scale-100");
    modalBackdrop.classList.add("opacity-0");
    modalPanel.classList.add(
      "opacity-0",
      "translate-y-4",
      "sm:translate-y-0",
      "sm:scale-95"
    );
    setTimeout(() => modal.classList.add("hidden"), 300);
  };

  document.querySelectorAll(".explain-code-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const codeElement = button.previousElementSibling.querySelector("code");
      const codeText = codeElement.innerText;

      modalContent.innerHTML =
        '<div class="flex items-center gap-2"><div class="loader"></div><span>Thinking of a simple analogy...</span></div>';
      openModal();

      const prompt = `In a max of 3 sentences, Explain the following Svelte 5 code snippet in a very simple way, like you're explaining it to a complete beginner ELI15. Use a creative analogy. Keep it concise and friendly.\n\nCode:\n\`\`\`javascript\n${codeText}\n\`\`\``;
      const explanation = await generateGeminiContent(prompt);
      modalContent.innerHTML = explanation;
    });
  });

  //close the modals afterwards
  closeModalBtn.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);
});
