'use client';

import { useState } from 'react';
import { Plus, Minus } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        className="flex items-center justify-between w-full text-left py-6 text-landing-text-primary hover:text-landing-primary-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-medium">{question}</h3>
        <div className="transition-transform duration-200 ease-in-out">
          {isOpen ? <Minus className="w-5 h-5 flex-shrink-0 text-landing-primary-600" /> : <Plus className="w-5 h-5 flex-shrink-0 text-landing-primary-600" />}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="pb-6 text-landing-text-secondary">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export const FAQSection = () => {
  const faqs = [
    {
      question: "How long can I use Twyn for free?",
      answer: "During the beta period, you can use Twyn for free with reasonable limits. The exact duration will be announced as we approach the end of the beta."
    },
    {
      question: "Are there usage limits during the beta period?",
      answer: "Yes, there are reasonable limits in place during the beta period to ensure system stability and fair usage for all users."
    },
    {
      question: "What happens after the beta period?",
      answer: "After the beta period ends, Twyn will transition to a paid subscription model. Beta users will receive early notice, special offers, and smooth migration support."
    },
    {
      question: "Do I need a Threads account to use Twyn?",
      answer: "Yes, Twyn integrates directly with Threads. You need to connect your Threads account to post, schedule, and manage content."
    },
    {
      question: "What are AI-powered interactions in Twyn?",
      answer: "AI-powered interactions in Twyn include automated content generation, tone optimization, smart scheduling, and context-aware comment replies—all designed to save you time and keep you consistent."
    },
    {
      question: "Can I purchase additional AI interactions with my Twyn subscription?",
      answer: "Additional AI interaction packages will be available after the beta period. Pricing and add-on options will be announced before the official launch."
    }
  ];

  return (
    <section id="faq" className="py-20 sm:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-landing-text-primary mb-4">
              Commonly asked questions
            </h2>
          </div>

          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};