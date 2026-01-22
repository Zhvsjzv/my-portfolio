# Modern Portfolio Website

A beautiful, modern, and responsive portfolio website built with HTML5, CSS3, and JavaScript.

## 🌟 Features

- **Modern Design**: Clean and contemporary UI with glassmorphism effects
- **Fully Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Smooth Animations**: Engaging scroll animations and transitions
- **Multiple Pages**: Home, Projects, About, and integrated Contact section
- **Project Showcase**: Beautiful grid layout for displaying projects
- **Skills Section**: Visual representation of technical skills
- **Experience Timeline**: Professional journey display
- **Testimonials**: Client feedback section
- **Contact Form**: Interactive form for getting in touch

## 📁 File Structure

```
portfolio/
├── index.html              # Homepage
├── projects.html           # Projects showcase page
├── about.html             # About me page
├── assets/
│   ├── css/
│   │   ├── main.css       # Main stylesheet
│   │   └── home.css       # Homepage specific styles
│   └── js/
│       └── main.js        # JavaScript functionality
├── images/                # Image assets
└── README.md             # This file
```

## 🎨 Color Scheme

- Primary Color: `#6366f1` (Indigo)
- Secondary Color: `#8b5cf6` (Purple)
- Accent Color: `#ec4899` (Pink)
- Background (Dark): `#0f172a`
- Background (Light): `#f8fafc`

## 🚀 Getting Started

1. **Clone or download** this repository
2. **Open** `index.html` in your web browser
3. **Customize** the content:
   - Update your name, bio, and information
   - Add your projects and descriptions
   - Update skills and experience
   - Add your social media links
   - Replace placeholder images

## 🔧 Customization

### Update Personal Information

Edit the HTML files to replace:
- Name and title in hero section
- Bio and description text
- Contact information in footer
- Social media links

### Add Your Projects

In `projects.html`, modify the project cards:

```html
<article class="project-card" data-category="web">
    <div class="project-image">
        <img src="your-image.jpg" alt="Project">
    </div>
    <div class="project-info">
        <h3>Your Project Name</h3>
        <p>Your project description</p>
        <div class="tech-stack">
            <span class="tech-tag">Tech1</span>
            <span class="tech-tag">Tech2</span>
        </div>
    </div>
</article>
```

### Change Colors

Modify CSS variables in `assets/css/main.css`:

```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
    --accent-color: #your-color;
}
```

### Update Images

Replace images in the `images/` folder or update image sources in HTML:
- Profile picture
- Project screenshots
- Background images

## 📱 Responsive Breakpoints

- Desktop: 1200px and above
- Tablet: 768px - 1024px
- Mobile: Below 768px

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📦 Dependencies

- Font Awesome 6.4.0 (Icons)
- Google Fonts (Optional)

## 🎯 Features Breakdown

### Navigation
- Fixed navigation bar with smooth scroll
- Mobile-responsive hamburger menu
- Theme toggle button
- Active page indicator

### Hero Section
- Animated background shapes
- Profile image with decorative border
- Social media links
- Call-to-action buttons

### Services Section
- Grid layout for services
- Hover effects
- Icon animations
- Feature lists

### Projects Section
- Filterable project grid
- Image overlay effects
- Technology tags
- Pagination

### About Page
- Profile image with decoration
- Statistics counter animation
- Skills progress bars
- Timeline for experience
- Client testimonials

### Contact Form
- Input validation
- Success notification
- Responsive layout

## 🛠️ JavaScript Features

- Theme switcher with localStorage
- Mobile menu toggle
- Smooth scroll
- Scroll animations (Intersection Observer)
- Form handling
- Project filtering
- Notification system
- Stats counter animation
- Custom cursor effect (desktop)
- Scroll-to-top button

## 📝 To-Do / Future Enhancements

- [ ] Add blog section
- [ ] Integrate backend for contact form
- [ ] Add more animation effects
- [ ] Implement project detail pages
- [ ] Add multilingual support
- [ ] Integrate with CMS
- [ ] Add loading animation
- [ ] Implement PWA features

## 📄 License

This project is free to use for personal and commercial purposes.

## 👨‍💻 Author

Muhammad Zargham Abbas
- Website: [Your Website]
- GitHub: [@yourusername]
- LinkedIn: [Your LinkedIn]
- Twitter: [@yourusername]

## 🙏 Acknowledgments

- Design inspired by modern web trends
- Icons by Font Awesome
- Images from Unsplash (placeholder)

---

Made with ❤️ by Muhammad Zargham Abbas
