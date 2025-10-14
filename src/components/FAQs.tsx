import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQs = () => {
  const faqs = [
    {
      question: "How does the AI transcription work?",
      answer: "Our AI-powered transcription uses advanced speech recognition to automatically generate accurate captions from your video audio. You can then customize every word, font, size, and position to match your style."
    },
    {
      question: "Can I customize individual words?",
      answer: "Yes! Our editor allows you to customize each word individually. You can change fonts, sizes, colors, positions, and apply different styles to create unique typography effects for your captions."
    },
    {
      question: "What video formats are supported?",
      answer: "We support all major video formats including MP4, MOV, AVI, and WebM. Your videos are processed securely and never stored on our servers longer than necessary."
    },
    {
      question: "Can I export my captions separately?",
      answer: "Yes, you can export your captions as subtitle files (.ass format) or download the video with captions burned directly into it."
    },
    {
      question: "Is there a free trial?",
      answer: "We offer a 7-day free trial so you can explore all features before subscribing. No credit card required to start."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely! You can cancel your subscription at any time. There are no long-term contracts or cancellation fees."
    }
  ];

  return (
    <section id="faqs" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our caption editor
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card hover:bg-card/80 transition-colors"
            >
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
