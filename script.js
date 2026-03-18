const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

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
    { threshold: 0.4 }
  );

  observer.observe(skillsSection);
}

const terminalOutput = document.getElementById('terminalOutput');
const terminalForm = document.getElementById('terminalForm');
const terminalInput = document.getElementById('terminalInput');

const terminalCommands = {
  help: [
    'Available commands:',
    'help    - List all commands',
    'bio     - Quick profile summary',
    'skills  - Technical highlights',
    'contact - Contact details',
    'clear   - Clear terminal output'
  ],
  bio: [
    'Zargham is a Data Scientist & Cyber Security Specialist.',
    'Focus: AI systems, automation, and ethical hacking.'
  ],
  skills: [
    'Data Science: Python, Pandas, TensorFlow',
    'Security: OSINT, Pentesting, Vulnerability Analysis',
    'Web: Modern HTML, CSS, JavaScript, performance-first UI'
  ],
  contact: [
    'Email: zargham@zargham.me',
    'Website: https://zargham.me'
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
    await wait(14);
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
};

const bootTerminal = async () => {
  if (!terminalOutput) {
    return;
  }

  await typeLine('Welcome to Zargham interactive terminal.');
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
