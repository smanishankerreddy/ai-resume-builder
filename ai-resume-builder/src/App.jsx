import { useMemo, useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('home')
  const [resumeData, setResumeData] = useState({
    personal: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      summary: 'Experienced software engineer with 5+ years in full-stack development, specializing in React, Node.js, and cloud technologies.'
    },
    experience: [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        duration: '2022 - Present',
        description: 'Led development of scalable web applications serving 1M+ users. Implemented microservices architecture and improved performance by 40%. Mentored junior developers and established coding standards.'
      },
      {
        id: 2,
        title: 'Software Engineer',
        company: 'StartupXYZ',
        location: 'Remote',
        duration: '2020 - 2022',
        description: 'Developed and maintained React-based dashboard applications. Collaborated with cross-functional teams to deliver features on time. Optimized database queries reducing load times by 30%.'
      }
    ],
    education: [
      {
        id: 1,
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of California, Berkeley',
        year: '2016 - 2020',
        gpa: '3.8/4.0'
      }
    ],
    skills: [
      'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL'
    ],
    projects: [
      {
        id: 1,
        name: 'E-commerce Platform',
        description: 'Full-stack e-commerce solution with React frontend, Node.js backend, and MongoDB. Features include user authentication, payment processing, and admin dashboard.',
        technologies: 'React, Node.js, MongoDB, Stripe API',
        link: 'https://github.com/johndoe/ecommerce'
      }
    ]
  })
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  const badgeClass =
    'inline-block rounded-full px-3 py-1 text-xs font-semibold text-white bg-pink-500/90'

  const buildSummary = useMemo(() => {
    const { personal, experience, education, skills, projects } = resumeData
    let output = `${personal.name}\n`
    output += `${personal.email} | ${personal.phone} | ${personal.location}\n\n`

    if (personal.summary) {
      output += `PROFESSIONAL SUMMARY\n${personal.summary}\n\n`
    }

    if (experience.length > 0) {
      output += `EXPERIENCE\n`
      experience.forEach(exp => {
        output += `${exp.title}\n${exp.company}, ${exp.location}\n${exp.duration}\n${exp.description}\n\n`
      })
    }

    if (education.length > 0) {
      output += `EDUCATION\n`
      education.forEach(edu => {
        output += `${edu.degree}\n${edu.school}, ${edu.year}`
        if (edu.gpa) output += ` (GPA: ${edu.gpa})`
        output += `\n\n`
      })
    }

    if (skills.length > 0) {
      output += `SKILLS\n${skills.join(' • ')}\n\n`
    }

    if (projects.length > 0) {
      output += `PROJECTS\n`
      projects.forEach(proj => {
        output += `${proj.name}\n${proj.description}\nTechnologies: ${proj.technologies}`
        if (proj.link) output += `\n${proj.link}`
        output += `\n\n`
      })
    }

    return output.trim()
  }, [resumeData])

  const updatePersonal = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }))
  }

  const updateExperience = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: '',
      company: '',
      location: '',
      duration: '',
      description: ''
    }
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
  }

  const removeExperience = (id) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const updateEducation = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }))
  }

  const addEducation = () => {
    const newEdu = {
      id: Date.now(),
      degree: '',
      school: '',
      year: '',
      gpa: ''
    }
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }

  const removeEducation = (id) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const updateSkills = (skillsString) => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean)
    setResumeData(prev => ({ ...prev, skills }))
  }

  const updateProject = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const addProject = () => {
    const newProj = {
      id: Date.now(),
      name: '',
      description: '',
      technologies: '',
      link: ''
    }
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }))
  }

  const removeProject = (id) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (allowedTypes.includes(file.type)) {
        setUploadedFile(file)
        setAnalysisResult(null)
      } else {
        alert('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      }
    }
  }

  const analyzeResume = () => {
    if (!uploadedFile) {
      alert('Please upload a file first')
      return
    }

    // Placeholder analysis (actual parsing happens in Phase 2 with Firebase)
    setAnalysisResult({
      score: 78,
      fileName: uploadedFile.name,
      pros: [
        'Professional format detected',
        'Good use of action keywords',
        'Clear section structure',
      ],
      cons: [
        'Could quantify achievements better',
        'Missing some technical keywords',
      ],
      suggestions: [
        'Add metrics to bullet points (e.g., "increased by X%")',
        'Include more technical skills relevant to target role',
        'Consider adding a professional summary',
      ],
    })
  }

  return (
    <div className="min-h-screen bg-[#E6F4FF] text-slate-800 flex flex-col">
      <header className="bg-pink-100 border-b border-pink-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-pink-500 px-2 py-1 text-xs sm:text-sm font-bold text-white">AI Resume</span>
            <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm font-medium text-pink-700">
              {['home', 'build', 'analyze', 'my-resumes'].map((key) => {
                const label =
                  key === 'my-resumes' ? 'My Resumes' : key === 'home' ? 'Home' : key === 'build' ? 'Build Resume' : 'Analyze Resume'
                return (
                  <button
                    key={key}
                    onClick={() => setPage(key)}
                    className={`rounded-md px-2 sm:px-3 py-1 transition ${page === key ? 'bg-pink-500 text-white' : 'hover:bg-pink-200'}`}
                  >
                    {label}
                  </button>
                )
              })}
            </nav>
          </div>
          <button className="rounded-md bg-white px-3 py-1 text-xs sm:text-sm font-semibold text-pink-600 hover:bg-pink-50 whitespace-nowrap">
            Login
          </button>
        </div>
      </header>

      <main className="flex-1 w-full py-6">
        {page === 'home' && (
          <section className="rounded-3xl bg-sky-50 p-6 sm:p-10 shadow-sm ring-1 ring-sky-100 max-w-5xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-800">
              AI Resume Builder & Analyzer
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              Build an ATS-friendly resume in minutes. Generate, score, and improve with smart AI-first suggestions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setPage('build')}
                className="rounded-xl bg-pink-500 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-pink-600 transition"
              >
                Build Resume
              </button>
              <button
                onClick={() => setPage('analyze')}
                className="rounded-xl border border-pink-300 bg-white px-6 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition"
              >
                Analyze Resume
              </button>
            </div>
          </section>
        )}

        {page === 'build' && (
          <section className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Resume Editor</h2>

                {/* Personal Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={resumeData.personal.name}
                      onChange={(e) => updatePersonal('name', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={resumeData.personal.email}
                      onChange={(e) => updatePersonal('email', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={resumeData.personal.phone}
                      onChange={(e) => updatePersonal('phone', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={resumeData.personal.location}
                      onChange={(e) => updatePersonal('location', e.target.value)}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                    <textarea
                      placeholder="Professional Summary"
                      value={resumeData.personal.summary}
                      onChange={(e) => updatePersonal('summary', e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                    />
                  </div>
                </div>

                {/* Experience */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Experience</h3>
                    <button
                      onClick={addExperience}
                      className="rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 hover:bg-green-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp) => (
                      <div key={exp.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Experience Entry</span>
                          <button
                            onClick={() => removeExperience(exp.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={exp.location}
                            onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={exp.duration}
                            onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <textarea
                            placeholder="Description"
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Education</h3>
                    <button
                      onClick={addEducation}
                      className="rounded-md bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.education.map((edu) => (
                      <div key={edu.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Education Entry</span>
                          <button
                            onClick={() => removeEducation(edu.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="School"
                            value={edu.school}
                            onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Year"
                            value={edu.year}
                            onChange={(e) => updateEducation(edu.id, 'year', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="GPA (optional)"
                            value={edu.gpa}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Skills</h3>
                  <textarea
                    placeholder="Skills (comma-separated)"
                    value={resumeData.skills.join(', ')}
                    onChange={(e) => updateSkills(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                  />
                </div>

                {/* Projects */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Projects</h3>
                    <button
                      onClick={addProject}
                      className="rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700 hover:bg-purple-200"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.projects.map((proj) => (
                      <div key={proj.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-slate-600">Project Entry</span>
                          <button
                            onClick={() => removeProject(proj.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={proj.name}
                            onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <textarea
                            placeholder="Description"
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Technologies"
                            value={proj.technologies}
                            onChange={(e) => updateProject(proj.id, 'technologies', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                          <input
                            type="text"
                            placeholder="Link (optional)"
                            value={proj.link}
                            onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Resume Preview</h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">Live preview updates as you edit</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Basic PDF download using browser print
                        const printWindow = window.open('', '_blank')
                        const resumeHTML = buildSummary.replace(/\n/g, '<br>')
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Resume - ${resumeData.personal.name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                              </style>
                            </head>
                            <body>
                              <h1>${resumeData.personal.name}</h1>
                              <p>${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}</p>
                              <pre style="white-space: pre-wrap; font-family: inherit;">${resumeHTML}</pre>
                            </body>
                          </html>
                        `)
                        printWindow.document.close()
                        printWindow.print()
                      }}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition flex items-center gap-2"
                    >
                      <span>📄</span> PDF
                    </button>
                    <button
                      onClick={() => {
                        // Basic Word document download
                        const resumeHTML = buildSummary.replace(/\n/g, '<br>')
                        const wordContent = `
                          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
                            <head>
                              <meta charset="utf-8">
                              <title>Resume - ${resumeData.personal.name}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                pre { white-space: pre-wrap; font-family: inherit; }
                              </style>
                            </head>
                            <body>
                              <h1>${resumeData.personal.name}</h1>
                              <p>${resumeData.personal.email} | ${resumeData.personal.phone} | ${resumeData.personal.location}</p>
                              <pre>${resumeHTML}</pre>
                            </body>
                          </html>
                        `

                        const blob = new Blob([wordContent], { type: 'application/msword' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${resumeData.personal.name.replace(/\s+/g, '_')}_resume.doc`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition flex items-center gap-2"
                    >
                      <span>📝</span> Word
                    </button>
                  </div>
                </div>
                <div className="min-h-[600px] rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-relaxed text-slate-700 overflow-y-auto font-mono">
                  <pre className="whitespace-pre-wrap break-words">{buildSummary}</pre>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={badgeClass}>ATS Friendly</span>
                  <span className={badgeClass}>Action Verbs</span>
                  <span className={badgeClass}>Modern Layout</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === 'analyze' && (
          <section className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Analyze Resume</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">Upload your resume in PDF or Word format.</p>

                <div className="mt-4 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <div className="text-3xl">📎</div>
                    <span className="text-sm font-semibold text-slate-700">Choose file</span>
                    <span className="text-xs text-slate-500">or drag and drop</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadedFile && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                    <p className="text-sm font-semibold text-green-700">
                      ✓ File selected: {uploadedFile.name}
                    </p>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="mt-2 text-xs text-green-600 hover:text-green-700 underline"
                    >
                      Clear file
                    </button>
                  </div>
                )}

                <button
                  onClick={analyzeResume}
                  disabled={!uploadedFile}
                  className="mt-4 w-full rounded-lg bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                >
                  Analyze Resume
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Analysis Results</h2>
                {!analysisResult && (
                  <p className="mt-2 text-sm text-slate-500">Upload and analyze a resume to see results.</p>
                )}
                {analysisResult && (
                  <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-700">
                    <div>
                      <span className="font-semibold">File:</span> {analysisResult.fileName}
                    </div>
                    <div>
                      <span className="font-semibold">Score:</span> {analysisResult.score}/100
                    </div>
                    <div>
                      <span className="font-semibold">Pros:</span>
                      <ul className="mt-1 list-disc pl-5">
                        {analysisResult.pros.map((pro, idx) => (
                          <li key={`pro-${idx}`}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold">Areas to Improve:</span>
                      <ul className="mt-1 list-disc pl-5">
                        {analysisResult.cons.map((con, idx) => (
                          <li key={`con-${idx}`}>{con}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold">Recommendations:</span>
                      <ul className="mt-1 list-disc pl-5">
                        {analysisResult.suggestions.map((suggestion, idx) => (
                          <li key={`suggestion-${idx}`}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {page === 'my-resumes' && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">My Resumes</h2>
            <p className="mt-2 text-sm text-slate-500">Coming soon: save, load, and manage your resumes.</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
