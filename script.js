const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const themeToggle = document.getElementById('themeToggle');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const htmlRoot = document.documentElement;
const storedTheme = localStorage.getItem('portfolio-theme');

if (storedTheme === 'light') {
  htmlRoot.setAttribute('data-theme', 'light');
  if (themeToggle) {
    themeToggle.textContent = '🌞';
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = htmlRoot.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    htmlRoot.setAttribute('data-theme', next);
    localStorage.setItem('portfolio-theme', next);
    themeToggle.textContent = next === 'light' ? '🌞' : '🌙';
  });
}

const meterFills = document.querySelectorAll('.meter-fill');
const skillsSection = document.getElementById('skills');

if (skillsSection && meterFills.length) {
  const fillMeters = () => {
    meterFills.forEach((fill) => {
      const level = Number(fill.dataset.level) || 0;
      fill.style.width = `${Math.max(0, Math.min(level, 100))}%`;
    });
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fillMeters();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.38 }
  );

  observer.observe(skillsSection);
}

const revealItems = document.querySelectorAll('.reveal');
if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const projectFilters = document.getElementById('projectFilters');
const projectCards = document.querySelectorAll('.project-card');

if (projectFilters && projectCards.length) {
  projectFilters.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const filter = target.dataset.filter;
    if (!filter) {
      return;
    }

    projectFilters.querySelectorAll('.filter-btn').forEach((btn) => btn.classList.remove('active'));
    target.classList.add('active');

    projectCards.forEach((card) => {
      const category = card.dataset.category;
      const show = filter === 'all' || category === filter;
      card.classList.toggle('hidden', !show);
    });
  });
}

const terminalOutput = document.getElementById('terminalOutput');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');

const terminalCommands = {
  help: [
    'Available commands:',
    'help     - List all commands',
    'bio      - About Muhammad Zargham Abbas',
    'skills   - Skill overview',
    'contact  - Contact information',
    'github   - Open GitHub profile',
    'clear    - Clear terminal output'
  ],
  bio: [
    'Name: Muhammad Zargham Abbas',
    'Role: Data Science Student (2nd Semester)',
    'University: University of Layyah',
    'Location: Layyah, Pakistan',
    'Also learning as a beginner ethical hacker.'
  ],
  skills: [
    'Python & Data Analysis',
    'Pandas / NumPy / ML basics',
    'OSINT and Pentesting fundamentals',
    'Modern frontend (HTML, CSS, JavaScript)'
  ],
  contact: [
    'Email: abbaszargham730@gmail.com',
    'Website: https://zargham.me',
    'GitHub: https://github.com/Zhvsjzv'
  ],
  github: [
    'Opening GitHub profile...',
    'https://github.com/Zhvsjzv'
  ]
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const appendLine = (text = '', className = '') => {
  if (!terminalOutput) {
    return;
  }
  const row = document.createElement('div');
  row.className = `line ${className}`.trim();
  row.textContent = text;
  terminalOutput.appendChild(row);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
};

const typeLine = async (text, className = '') => {
  if (!terminalOutput) {
    return;
  }
  const row = document.createElement('div');
  row.className = `line ${className}`.trim();
  terminalOutput.appendChild(row);

  for (const char of text) {
    row.textContent += char;
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    await wait(10);
  }
};

const runTerminalCommand = async (rawCommand) => {
  const command = rawCommand.trim().toLowerCase();

  if (!command) {
    return;
  }

  appendLine(`$ ${command}`, 'command');

  if (command === 'clear') {
    terminalOutput.innerHTML = '';
    return;
  }

  const response = terminalCommands[command] || [
    `Command not found: ${command}`,
    'Type "help" to see available commands.'
  ];

  for (const line of response) {
    await typeLine(line);
  }

  if (command === 'github') {
    setTimeout(() => {
      window.open('https://github.com/Zhvsjzv', '_blank', 'noopener,noreferrer');
    }, 420);
  }
};

const bootTerminal = async () => {
  if (!terminalOutput) {
    return;
  }

  await typeLine('Welcome to Muhammad Zargham Abbas interactive terminal.');
  await typeLine('Type "help" to get started.');
};

if (terminalForm && terminalInput) {
  terminalForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const command = terminalInput.value;
    terminalInput.value = '';
    await runTerminalCommand(command);
  });

  terminalInput.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      terminalInput.value = 'help';
    }
  });

  bootTerminal();
}

const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const toastContainer = document.getElementById('toastContainer');

const setFieldError = (name, message) => {
  const errorEl = document.querySelector(`.error[data-for="${name}"]`);
  if (errorEl) {
    errorEl.textContent = message;
  }
};

const clearErrors = () => {
  document.querySelectorAll('.error').forEach((error) => {
    error.textContent = '';
  });
};

const showToast = (message, type = 'success') => {
  if (!toastContainer) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const submitContactForm = async (payload) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const message = String(formData.get('message') || '').trim();

    let hasError = false;

    if (!name) {
      setFieldError('name', 'Name is required.');
      hasError = true;
    }

    if (!email) {
      setFieldError('email', 'Email is required.');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setFieldError('email', 'Enter a valid email address.');
      hasError = true;
    }

    if (!message) {
      setFieldError('message', 'Message is required.');
      hasError = true;
    }

    if (hasError) {
      showToast('Please fix the highlighted errors.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      await submitContactForm({ name, email, message });
      showToast('Message sent successfully. I will get back to you soon!', 'success');
      contactForm.reset();
    } catch (error) {
      showToast('Submission failed. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    }
  });
}

const particleCanvas = document.getElementById('particleCanvas');

if (particleCanvas instanceof HTMLCanvasElement) {
  const context = particleCanvas.getContext('2d');

  if (context) {
    const particles = [];
    let width = 0;
    let height = 0;

    const createParticles = (count) => {
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1 + Math.random() * 2,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    };

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      particleCanvas.width = width;
      particleCanvas.height = height;
      const count = Math.min(90, Math.floor((width * height) / 22000));
      createParticles(count);
    };

    const drawParticles = () => {
      context.clearRect(0, 0, width, height);

      const theme = htmlRoot.getAttribute('data-theme');
      const fillColor = theme === 'light' ? 'rgba(0, 120, 160, 0.35)' : 'rgba(0, 229, 255, 0.45)';

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) {
          particle.vx *= -1;
        }

        if (particle.y < 0 || particle.y > height) {
          particle.vy *= -1;
        }

        context.beginPath();
        context.fillStyle = fillColor;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawParticles();
  }
}
