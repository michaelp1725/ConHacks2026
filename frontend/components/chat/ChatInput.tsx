"use client";

import { FormEvent } from "react";

type ChatInputProps = {
  value: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ChatInput({
  value,
  isLoading,
  onChange,
  onSubmit,
}: ChatInputProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="research-input-form">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question about Canadian refugee law..."
        className="research-input"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="research-send-button"
      >
        {isLoading ? "Sending" : "Send"}
      </button>
    </form>
  );
}
