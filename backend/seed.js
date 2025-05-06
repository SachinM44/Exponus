const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); // Import bcryptjs

// Sample long-form blog content
const blogContents = [
  {
    title: "The Future of AI in Healthcare: A 2025 Perspective",
    content: `# The Transformative Power of AI in Modern Medicine
    
    ## Introduction
    In recent years, artificial intelligence has revolutionized healthcare delivery...
    
    ## Diagnostic Breakthroughs
    Deep learning algorithms can now analyze medical imaging with 98% accuracy...
    
    ### Case Study: Cancer Detection
    Google Health's LYNA system reduced false positives in breast cancer screening by 52%...
    
    ## Ethical Considerations
    While promising, AI raises important questions about data privacy and algorithmic bias...
    
    ## Conclusion
    As we move forward, the synergy between human expertise and machine intelligence...`
  },
  {
    title: "Remote Work Revolution: Building Sustainable Distributed Teams",
    content: `# The New Era of Digital Nomadism
    
    ## Workplace Evolution
    Post-pandemic statistics show 68% of tech companies now offer hybrid models...
    
    ## Best Practices
    - Asynchronous communication frameworks
    - Results-oriented performance metrics
    - Virtual team-building exercises
    
    ## Tool Stack Recommendations
    Detailed analysis of Zoom alternatives like Gather.town and spatial.chat...
    
    ## Mental Health Considerations
    Importance of digital detox routines and virtual watercooler channels...`
  },
  {
    title: "WebAssembly: The Next Frontier in Web Development",
    content: `# Breaking Browser Barriers with WASM
    
    ## Performance Benchmarks
    Comparative analysis of JavaScript vs WebAssembly in 3D rendering tasks...
    
    ## Use Cases
    1. Photopea's Photoshop-level image editing in browser
    2. Figma's real-time collaboration engine
    3. AutoCAD Web's complex computations
    
    ## Implementation Guide
    Step-by-step tutorial for compiling C++ modules to WASM using Emscripten...
    
    ## Future Predictions
    Potential integration with edge computing and IoT devices...`
  }
  // ... 18 more unique blog contents
];

async function main() {
  // Hash passwords before seeding
  const hashedPassword1 = await bcrypt.hash("securePassword1", 10);
  const hashedPassword2 = await bcrypt.hash("securePassword2", 10);
  const hashedPassword3 = await bcrypt.hash("securePassword3", 10);

  // Create 3 professional users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Dr. Sarah Chen",
        username: "sarah_ai_researcher",
        password: hashedPassword1 // Use hashed password
      }
    }),
    prisma.user.create({
      data: {
        name: "James Techwright",
        username: "james_dev_lead",
        password: hashedPassword2 // Use hashed password
      }
    }),
    prisma.user.create({
      data: {
        name: "Lila Codesmith",
        username: "lila_fullstack",
        password: hashedPassword3 // Use hashed password
      }
    })
  ]);

  // Create 7 blogs per user with unique content
  for (const user of users) {
    for (let i = 0; i < 7; i++) {
      const content = blogContents[i % blogContents.length];
      await prisma.blog.create({
        data: {
          authorId: user.id,
          title: `${content.title} (Part ${i + 1})`,
          content: `${content.content}\n\n## Author Perspective\nAs ${user.name.split(' ')[0]} notes...`,
          published: Math.random() > 0.3
        }
      });
    }
  }

  console.log('Seeded 3 users with 21 professional-grade blogs');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
