'use client';

import { useState } from 'react';
import { Plus, Minus } from "lucide-react";
import { useLocaleContext } from "@/components/providers/LocaleProvider";

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
  const { t } = useLocaleContext();
  
  const faqs = [
    {
      question: t('landing.faq.questions.q1'),
      answer: t('landing.faq.questions.a1')
    },
    {
      question: t('landing.faq.questions.q2'),
      answer: t('landing.faq.questions.a2')
    },
    {
      question: t('landing.faq.questions.q3'),
      answer: t('landing.faq.questions.a3')
    },
    {
      question: t('landing.faq.questions.q4'),
      answer: t('landing.faq.questions.a4')
    },
    {
      question: t('landing.faq.questions.q5'),
      answer: t('landing.faq.questions.a5')
    },
    {
      question: t('landing.faq.questions.q6'),
      answer: t('landing.faq.questions.a6')
    }
  ];

  return (
    <section id="faq" className="pb-20 sm:pb-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-landing-text-primary mb-4">
              {t('landing.faq.title')}
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