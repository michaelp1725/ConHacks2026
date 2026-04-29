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
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm"
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask a question about Canadian refugee law..."
        className="max-h-40 min-h-12 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2 text-slate-800 outline-none focus:border-blue-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="rounded-xl bg-blue-700 px-5 py-2 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Send
      </button>
    </form>
  );
}
