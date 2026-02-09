const API_BASE = `http://${window.location.hostname}:8000/api`;

export const api = {
  async convertFile(file: File): Promise<{ markdown: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/convert/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `Conversion failed: ${res.statusText}`);
    }
    return res.json();
  },

  async generateQuizFromContent(params: {
    markdown_content: string;
    mode: string;
    num_mcq: number;
    num_subjective: number;
    num_bcq: number;
  }): Promise<{ questions: any[] }> {
    const res = await fetch(`${API_BASE}/quiz/generate-from-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `Generation failed: ${res.statusText}`);
    }
    return res.json();
  },

  async generateQuizFromAI(params: {
    topic: string;
    sub_topic: string;
    todo?: string;
    to_avoid?: string;
    mode: string;
    num_mcq: number;
    num_subjective: number;
    num_bcq: number;
  }): Promise<{ questions: any[] }> {
    const res = await fetch(`${API_BASE}/quiz/generate-from-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `Generation failed: ${res.statusText}`);
    }
    return res.json();
  },

  async evaluateQuiz(params: {
    quiz_json: any[];
    user_answers_json: any[];
    notes_markdown?: string | null;
  }): Promise<{ results: { question_number: number; score: number }[] }> {
    const res = await fetch(`${API_BASE}/evaluate/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.detail || `Evaluation failed: ${res.statusText}`);
    }
    return res.json();
  },
};
