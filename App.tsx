
import React, { useRef, useState, useEffect } from 'react';
import { Mail, Phone, Github, MapPin, Printer, FileDown, Loader2, Sparkles, Upload, FileText, RefreshCw, ArrowLeft, FileType, CheckCircle2, LayoutTemplate, Layers, Square, Moon, Sun } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Project, Experience, SkillGroup } from './types';

// Declare libraries for TypeScript
declare var html2pdf: any;
declare var pdfjsLib: any;

type TemplateId = 'classic' | 'modern' | 'minimalist';

interface ResumeData {
  name: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  summary: string;
  skills: SkillGroup[];
  experiences: Experience[];
  projects: Project[];
  education: {
    degree: string;
    institution: string;
    date: string;
    grade: string;
  };
}

const App: React.FC = () => {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [view, setView] = useState<'input' | 'preview'>('input');
  const [userInput, setUserInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic');
  
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: 'Amaan Khan',
    location: 'Islamabad, Pakistan',
    email: 'amaan.dev@example.com',
    phone: '+92 300 1234567',
    github: 'github.com/amaan-dev',
    linkedin: 'linkedin.com/in/amaan-dev',
    summary: 'Senior Full-Stack Engineer specialized in React and Node.js, focused on building efficient internal tools and financial tracking systems.',
    skills: [
      { category: "Frontend", skills: "React, Next.js, Tailwind CSS, Redux" },
      { category: "Backend", skills: "Node.js, Express, MongoDB, PostgreSQL" },
      { category: "Tools", skills: "Docker, AWS, Git, CI/CD" }
    ],
    experiences: [],
    projects: [
      {
        title: "Expense Management System",
        date: "2023 - Present",
        description: [
          "Designed and developed a full-stack expense management system for internal company use.",
          "Implemented financial tracking with monthly summaries and automatic balance calculations.",
          "Built complete CRUD functionality for vendors and office expenses using React and Node.js."
        ],
        tech: "React, Node.js, Express, MongoDB"
      }
    ],
    education: {
      degree: 'BS in Computer Science',
      institution: 'FAST NUCES',
      date: '2019 - 2023',
      grade: '3.7/4.0'
    }
  });

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const handleAIProcess = async (textToProcess?: string) => {
    const content = textToProcess || userInput;
    if (!content.trim()) return;

    setIsProcessingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract and structure the following resume information into a professional format. Ensure all experience bullets are result-oriented.
        Input text: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              location: { type: Type.STRING },
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              github: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              summary: { type: Type.STRING },
              education: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  date: { type: Type.STRING },
                  grade: { type: Type.STRING }
                },
                required: ["degree", "institution", "date"]
              },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    skills: { type: Type.STRING }
                  },
                  required: ["category", "skills"]
                }
              },
              experiences: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    company: { type: Type.STRING },
                    type: { type: Type.STRING },
                    date: { type: Type.STRING },
                    location: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["role", "company", "date", "bullets"]
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tech: { type: Type.STRING }
                  },
                  required: ["title", "description", "tech"]
                }
              }
            },
            required: ["name", "summary", "skills", "experiences", "projects", "education"]
          }
        }
      });

      const structuredData = JSON.parse(response.text) as ResumeData;
      setResumeData({
        ...structuredData,
        name: structuredData.name || '',
        location: structuredData.location || '',
        email: structuredData.email || '',
        phone: structuredData.phone || '',
        github: structuredData.github || '',
        linkedin: structuredData.linkedin || '',
        summary: structuredData.summary || '',
        skills: structuredData.skills || [],
        experiences: structuredData.experiences || [],
        projects: structuredData.projects || [],
        education: {
          degree: structuredData.education?.degree || '',
          institution: structuredData.education?.institution || '',
          date: structuredData.education?.date || '',
          grade: structuredData.education?.grade || ''
        }
      });
      setView('preview');
    } catch (error) {
      console.error("AI Processing failed:", error);
      alert("Failed to process resume data. Please try again.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'application/pdf') {
      setIsExtractingPDF(true);
      try {
        const text = await extractTextFromPDF(file);
        setUserInput(text);
        if (text.length > 50) await handleAIProcess(text);
      } catch (err) {
        alert("Failed to extract PDF text.");
      } finally {
        setIsExtractingPDF(false);
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (file.type === 'application/json') {
        try {
          setResumeData(JSON.parse(content));
          setView('preview');
        } catch (err) { alert("Invalid JSON"); }
      } else { setUserInput(content); }
    };
    reader.readAsText(file);
  };

  const handleDownloadPDF = () => {
    if (!resumeRef.current) return;
    setIsGenerating(true);
    window.scrollTo(0, 0);
    const element = resumeRef.current;
    const safeName = (resumeData.name || 'Resume').replace(/\s+/g, '_');
    const opt = {
      margin: 0,
      filename: `${safeName}_Resume.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save().then(() => setIsGenerating(false)).catch(() => setIsGenerating(false));
  };

  const cleanUrl = (url?: string) => (url || '').replace('https://', '').replace('http://', '').replace(/\/$/, '');
  const isValid = (val?: string) => val && val.trim() !== '' && val.toLowerCase() !== 'n/a' && val.toLowerCase() !== 'not specified' && val.toLowerCase() !== 'none';

  // Logo Component
  const StudioLogo = () => (
    <div className="relative w-20 h-20 mb-6 group cursor-default">
      <div className={`absolute inset-0 rotate-45 group-hover:rotate-90 transition-transform duration-500 ${isDarkMode ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-black'}`}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`w-14 h-14 flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-500 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
           <span className={`font-black text-2xl tracking-tighter ${isDarkMode ? 'text-white' : 'text-black'}`}>RS</span>
        </div>
      </div>
    </div>
  );

  // Layout Templates (Inside preview paper)
  const ClassicLayout = () => (
    <div className="flex flex-col gap-5 font-serif text-black">
      <header className="text-center border-b-[3px] border-black pb-4">
        <h1 className="text-3xl font-bold mb-2 uppercase tracking-tight">{resumeData.name}</h1>
        <div className="flex flex-wrap justify-center items-center gap-1 text-[11px] font-medium">
          {isValid(resumeData.location) && <span>{resumeData.location}</span>}
          {isValid(resumeData.email) && <span className="before:content-['|'] before:mx-2">{resumeData.email}</span>}
          {isValid(resumeData.phone) && <span className="before:content-['|'] before:mx-2">{resumeData.phone}</span>}
          {isValid(resumeData.linkedin) && <span className="before:content-['|'] before:mx-2">{cleanUrl(resumeData.linkedin)}</span>}
          {isValid(resumeData.github) && <span className="before:content-['|'] before:mx-2">{cleanUrl(resumeData.github)}</span>}
        </div>
      </header>
      {isValid(resumeData.summary) && (
        <section>
          <h2 className="text-[13px] font-bold border-b border-black mb-1.5 uppercase tracking-widest">Summary</h2>
          <p className="text-[10.5px] leading-relaxed text-justify">{resumeData.summary}</p>
        </section>
      )}
      {resumeData.experiences.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold border-b border-black mb-2 uppercase tracking-widest">Experience</h2>
          <div className="space-y-3.5">
            {resumeData.experiences.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline font-bold text-[11.5px]">
                  <span>{exp.company}</span>
                  <span>{exp.date}</span>
                </div>
                <div className="flex justify-between items-baseline italic text-[10.5px] mb-0.5">
                  <span>{exp.role}</span>
                  {isValid(exp.location) && <span>{exp.location}</span>}
                </div>
                <ul className="list-disc ml-4 space-y-0.5">
                  {exp.bullets.map((b, idx) => <li key={idx} className="text-[10.5px] leading-snug">{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      {resumeData.projects.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold border-b border-black mb-1.5 uppercase tracking-widest">Projects</h2>
          <div className="space-y-3">
            {resumeData.projects.map((proj, i) => (
              <div key={i}>
                <div className="flex justify-between font-bold text-[11.5px]">
                  <span>{proj.title}</span>
                  <span className="font-normal italic text-[10px]">{proj.date}</span>
                </div>
                <div className="text-[10.5px] leading-snug mt-0.5">
                  {proj.description.map((d, idx) => <p key={idx}>{d}</p>)}
                </div>
                {isValid(proj.tech) && <p className="text-[9.5px] mt-0.5"><span className="font-bold">Technologies:</span> {proj.tech}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {resumeData.skills.length > 0 && (
        <section>
          <h2 className="text-[13px] font-bold border-b border-black mb-1.5 uppercase tracking-widest">Skills</h2>
          <div className="space-y-0.5">
            {resumeData.skills.map((s, i) => (
              <div key={i} className="text-[10.5px]">
                <span className="font-bold">{s.category}:</span> {s.skills}
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-[13px] font-bold border-b border-black mb-1.5 uppercase tracking-widest">Education</h2>
        <div className="text-[10.5px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>{resumeData.education.institution}</span>
            <span>{resumeData.education.date}</span>
          </div>
          <p className="italic">{resumeData.education.degree}</p>
          {isValid(resumeData.education.grade) && <p className="text-[9.5px] font-bold">Status: {resumeData.education.grade}</p>}
        </div>
      </section>
    </div>
  );

  const ModernLayout = () => (
    <div className="flex flex-col gap-6 font-sans text-black">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight leading-none uppercase">{resumeData.name}</h1>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-gray-700">
          {isValid(resumeData.email) && <span>{resumeData.email}</span>}
          {isValid(resumeData.phone) && <span>{resumeData.phone}</span>}
          {isValid(resumeData.linkedin) && <span>{cleanUrl(resumeData.linkedin)}</span>}
        </div>
      </header>
      <section>
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-gray-400">Expertise</h2>
        <div className="grid grid-cols-2 gap-y-3 gap-x-5">
          {resumeData.skills.map((s, i) => (
            <div key={i}>
              <span className="block text-[9px] font-black uppercase mb-0.5">{s.category}</span>
              <span className="text-[10.5px] text-gray-700 font-medium">{s.skills}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-gray-400">Experience</h2>
        <div className="space-y-5">
          {resumeData.experiences.map((exp, i) => (
            <div key={i} className="relative pl-5 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[1px] before:bg-gray-200">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="text-[13px] font-black uppercase">{exp.role}</h3>
                <span className="text-[9px] font-black text-gray-400">{exp.date}</span>
              </div>
              <p className="text-[11px] font-bold mb-2">{exp.company}</p>
              <ul className="space-y-1">
                {exp.bullets.map((b, idx) => (
                  <li key={idx} className="text-[10.5px] leading-relaxed flex gap-2"><span className="text-black font-black">•</span>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const MinimalistLayout = () => (
    <div className="flex flex-col gap-8 font-sans text-black">
      <header className="flex justify-between items-start border-b-[5px] border-black pb-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{resumeData.name}</h1>
        </div>
        <div className="text-right text-[10px] font-bold space-y-0.5 uppercase tracking-widest text-gray-400">
          <p>{resumeData.email}</p>
          <p>{resumeData.phone}</p>
          <p>{cleanUrl(resumeData.linkedin)}</p>
        </div>
      </header>
      <section className="flex gap-8">
        <h2 className="w-32 text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] pt-0.5 shrink-0">History</h2>
        <div className="flex-1 space-y-7">
          {resumeData.experiences.map((exp, i) => (
            <div key={i}>
              <h3 className="text-lg font-black uppercase tracking-tight">{exp.role}</h3>
              <p className="text-[11px] font-black text-black uppercase mb-2 tracking-widest">{exp.company} • {exp.date}</p>
              <ul className="space-y-2">
                {exp.bullets.map((b, idx) => (
                  <li key={idx} className="text-[12px] text-gray-600 font-medium leading-relaxed border-l-[2px] border-black pl-4">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  // Theme Constants
  const themeContainer = isDarkMode ? 'bg-[#0A0A0A] text-white' : 'bg-[#FDFDFD] text-black';
  const themeBox = isDarkMode ? 'bg-black border-white shadow-[10px_10px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]';
  const themeInput = isDarkMode ? 'bg-[#151515] text-white placeholder-gray-600' : 'bg-gray-50 text-black placeholder-gray-400';

  return (
    <div className={`flex flex-col items-center min-h-screen selection:bg-gray-500 selection:text-white pb-20 transition-colors duration-500 ${themeContainer}`}>
      {/* Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 p-3 rounded-full border-2 transition-all duration-300 z-50 ${isDarkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black'} hover:scale-110`}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {view === 'input' ? (
        <div className="w-full max-w-6xl p-6 md:p-12 mt-4 space-y-16">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <StudioLogo />
            <h1 className="text-7xl font-black mb-4 tracking-tighter uppercase leading-none">
              Resume <span className="italic font-serif">Studio</span>
            </h1>
            <p className={`text-lg font-medium max-w-2xl mx-auto uppercase tracking-[0.5em] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Monochrome • ATS-Ready • v4.5
            </p>
          </div>

          {/* Template Selection */}
          <div className="space-y-8">
            <h2 className={`text-center text-[10px] font-black uppercase tracking-[0.6em] ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>Step 01 / Select Template</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(['classic', 'modern', 'minimalist'] as TemplateId[]).map((t) => (
                <button 
                  key={t}
                  onClick={() => setSelectedTemplate(t)}
                  className={`group relative p-8 rounded-none border-[3px] transition-all duration-300 text-left ${selectedTemplate === t ? themeBox + ' -translate-x-1 -translate-y-1' : (isDarkMode ? 'border-gray-800 bg-transparent hover:border-white' : 'border-gray-100 bg-white hover:border-black')}`}
                >
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tighter group-hover:italic transition-all">
                    {t === 'classic' ? 'Harvard' : t === 'modern' ? 'Modernist' : 'Minimal'}
                  </h3>
                  <p className={`text-[11px] font-bold uppercase leading-relaxed tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t === 'classic' ? 'Traditional corporate single-column.' : t === 'modern' ? 'Bold lines and sans-serif fonts.' : 'High-density information layout.'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Master Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
            {/* LEFT COLUMN: SOURCE & IMPORT (Determines height) */}
            <div className="lg:col-span-8 flex flex-col gap-12">
              <div className="space-y-6">
                <h2 className={`text-[10px] font-black uppercase tracking-[0.6em] ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>Step 02 / Resume Source</h2>
                <div className={`p-6 rounded-none border-[3px] shadow-[15px_15px_0px_0px] transition-all ${isDarkMode ? 'bg-black border-white shadow-white/10' : 'bg-white border-black shadow-black'}`}>
                  <textarea 
                    className={`w-full h-96 p-4 border-none focus:ring-0 text-base font-medium transition-all ${themeInput}`}
                    placeholder="Paste your raw experience, projects, and education text here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h2 className={`text-[10px] font-black uppercase tracking-[0.6em] ${isDarkMode ? 'text-gray-700' : 'text-gray-300'}`}>Step 03 / Legacy Import</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`relative group overflow-hidden border-[3px] p-10 text-center transition-all cursor-pointer shadow-[8px_8px_0px_0px] ${isDarkMode ? 'bg-black border-white shadow-white/10 hover:bg-white hover:text-black' : 'bg-white border-black shadow-black hover:bg-black hover:text-white'}`}>
                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <FileType className="mb-4 mx-auto" size={40} />
                    <span className="block text-xs font-black uppercase tracking-[0.2em]">Read Old PDF</span>
                  </div>
                  <div className={`relative group overflow-hidden border-[3px] p-10 text-center transition-all cursor-pointer shadow-[8px_8px_0px_0px] ${isDarkMode ? 'bg-black border-white shadow-white/10 hover:bg-white hover:text-black' : 'bg-white border-black shadow-black hover:bg-black hover:text-white'}`}>
                    <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <FileText className="mb-4 mx-auto" size={40} />
                    <span className="block text-xs font-black uppercase tracking-[0.2em]">Import JSON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: AI ENGINE (Vertically centered relative to the left column) */}
            <div className="lg:col-span-4 flex flex-col justify-center sticky top-12 self-center">
              <div className={`p-8 border-[4px] flex flex-col gap-10 transition-all ${isDarkMode ? 'bg-white text-black border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-black text-white border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]'}`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center font-black text-xl ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>AI</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Studio Engine</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex gap-4 text-[10px] font-bold uppercase tracking-widest items-start">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>01</span>
                      <p>ATS Logical Ranking</p>
                    </li>
                    <li className="flex gap-4 text-[10px] font-bold uppercase tracking-widest items-start">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>02</span>
                      <p>Monochrome Optimization</p>
                    </li>
                    <li className="flex gap-4 text-[10px] font-bold uppercase tracking-widest items-start">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>03</span>
                      <p>Financial System Parser</p>
                    </li>
                  </ul>
                </div>
                
                <button 
                  onClick={() => handleAIProcess()}
                  disabled={isProcessingAI || isExtractingPDF || !userInput.trim()}
                  className={`w-full font-black py-4 rounded-none flex items-center justify-center gap-3 transition-all text-base uppercase tracking-widest border-2 disabled:opacity-50 disabled:cursor-not-allowed group ${isDarkMode ? 'bg-black text-white border-black hover:bg-white hover:text-black hover:border-black' : 'bg-white text-black border-white hover:bg-black hover:text-white'}`}
                >
                  {isProcessingAI ? <Loader2 className="animate-spin" size={22} /> : <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" size={22} />}
                  <span>{isProcessingAI ? 'Generating...' : 'Build Resume'}</span>
                </button>

                <div className="flex justify-center gap-4">
                  <CheckCircle2 size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span className={`text-[8px] font-bold uppercase tracking-widest italic ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ready to Print</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview View */
        <div className={`w-full flex flex-col items-center py-12 px-4 transition-colors duration-500 ${isDarkMode ? 'bg-[#111]' : 'bg-gray-50'}`}>
          <div className={`no-print mb-12 flex flex-wrap justify-center gap-6 fixed top-8 z-50 p-5 rounded-none border-[4px] shadow-[15px_15px_0px_0px] transition-all ${isDarkMode ? 'bg-black border-white shadow-white/10' : 'bg-white border-black shadow-black'}`}>
            <button onClick={() => setView('input')} className={`flex items-center gap-3 px-8 py-3 rounded-none font-black text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'bg-white text-black hover:bg-black hover:text-white border border-white' : 'bg-gray-100 hover:bg-black hover:text-white border border-transparent'}`}><ArrowLeft size={18} /> Editor</button>
            <button onClick={handleDownloadPDF} disabled={isGenerating} className={`flex items-center gap-3 px-12 py-3 rounded-none transition-all font-black text-xs uppercase tracking-widest border-2 ${isDarkMode ? 'bg-white text-black border-white hover:bg-black hover:text-white' : 'bg-black text-white border-black hover:bg-white hover:text-black'}`}>{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />} Save PDF</button>
            <button onClick={() => window.print()} className={`flex items-center gap-3 px-8 py-3 rounded-none transition-all font-black text-xs uppercase tracking-widest ${isDarkMode ? 'bg-white text-black hover:bg-black hover:text-white border border-white' : 'bg-gray-100 hover:bg-black hover:text-white border border-transparent'}`}><Printer size={18} /> Print</button>
          </div>
          <div 
            ref={resumeRef}
            style={{ height: '296.8mm', boxSizing: 'border-box' }}
            className="resume-container bg-white w-full max-w-[210mm] shadow-none p-16 flex flex-col text-black leading-relaxed overflow-hidden border border-gray-100"
          >
            {selectedTemplate === 'modern' ? <ModernLayout /> : selectedTemplate === 'classic' ? <ClassicLayout /> : <MinimalistLayout />}
            <footer className="mt-auto pt-10 border-t border-gray-100 text-[8px] text-gray-300 text-center uppercase tracking-[1em] font-black italic">
              AI Resume Studio • Professional Edition • v4.5
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
