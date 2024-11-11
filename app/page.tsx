"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRecordVoice } from "@/hooks/useRecordVoice";
import AuthButton from "@/components/AuthButton";

// Define the type for an email
type Email = {
  from: string;
  subject: string;
  snippet: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useTTS, setUseTTS] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]); // Use the Email type here

  // Using the useRecordVoice hook for voice input
  const { recording, startRecording, stopRecording, text } = useRecordVoice();

  // Update input box with transcribed text once available
  if (text && input !== text) {
    setInput(text);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInput(e.target.value);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return; // Prevent submitting empty input

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setInput(""); // Clear the input field

    try {
      const response = await fetch("/api/chatWithFunctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      console.log("data in front end: ", data);
      // Check if response contains an array of emails
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        data[0].from &&
        data[0]?.subject
      ) {
        setEmails(data); // set emails to state for displaying
      } else if (data.choices && data.choices.length > 0) {
        const botMessage = {
          role: "assistant",
          content: data.choices[0].message.content,
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);

        if (useTTS) {
          // Trigger TTS for the assistant's response
          await playTextAsSpeech(botMessage.content);
        }
      } else {
        console.error("Unexpected API response:", data);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle TTS if the checkbox is enabled
  const playTextAsSpeech = async (text: string) => {
    const response = await fetch("/api/textToSpeech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } else {
      console.error("Error playing TTS audio.");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto">
      {messages.map((m, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle>{m.role === "user" ? "You" : "AI"}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="whitespace-pre-wrap">
              {m.content}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
      {/* Display Fetched Emails */}
      {emails.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {emails.map((email, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <CardTitle>{email.from}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    <strong>Subject:</strong> {email.subject}
                  </CardDescription>
                  <CardDescription>
                    <strong>Snippet:</strong> {email.snippet}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={useTTS}
          onChange={(e) => setUseTTS(e.target.checked)}
          className="mr-2"
        />
        <label>Enable Text-to-Speech for Responses</label>
      </div>

      <Button onClick={() => (recording ? stopRecording() : startRecording())}>
        {recording ? "Stop Recording" : "Record with Microphone"}
      </Button>
      <AuthButton />

      <form
        onSubmit={handleFormSubmit}
        className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl bg-white"
      >
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message or use the microphone..."
          className="w-full p-2 mb-2"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Thinking..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
