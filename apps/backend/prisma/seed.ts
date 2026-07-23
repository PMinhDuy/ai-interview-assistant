import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ai-interview.dev' },
    update: {},
    create: {
      email: 'admin@ai-interview.dev',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  // Create test user
  const userHash = await bcrypt.hash('User123!', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@ai-interview.dev' },
    update: {},
    create: {
      email: 'user@ai-interview.dev',
      passwordHash: userHash,
      firstName: 'Test',
      lastName: 'User',
      role: Role.USER,
      isEmailVerified: true,
    },
  });

  // Seed initial prompts
  await prisma.prompt.upsert({
    where: { name_version: { name: 'resume-analysis', version: 1 } },
    update: {},
    create: {
      name: 'resume-analysis',
      version: 1,
      description: 'Analyzes resume content for ATS score, strengths, and weaknesses',
      template: `<resume_analysis>
  <context>
    You are an expert technical recruiter and career coach with 10+ years of experience.
    Analyze the following resume objectively and provide actionable feedback.
  </context>
  
  <resume>
    {{resume_text}}
  </resume>
  
  <job_description>
    {{job_description}}
  </job_description>
  
  <instructions>
    Analyze the resume against the job description and provide:
    1. ATS compatibility score (0-100)
    2. Key strengths (3-5 points)
    3. Weaknesses or gaps (3-5 points)
    4. Missing skills for the role
    5. Prioritized improvement suggestions
    
    Respond in valid JSON matching this schema exactly:
    {
      "atsScore": number,
      "strengths": string[],
      "weaknesses": string[],
      "missingSkills": string[],
      "suggestions": string[],
      "keywordDensity": Record<string, number>
    }
  </instructions>
</resume_analysis>`,
      variables: ['resume_text', 'job_description'],
      isActive: true,
    },
  });

  await prisma.prompt.upsert({
    where: { name_version: { name: 'interview-question-generator', version: 1 } },
    update: {},
    create: {
      name: 'interview-question-generator',
      version: 1,
      description: 'Generates tailored interview questions based on role and resume',
      template: `<question_generation>
  <context>
    You are a senior technical interviewer. Generate {{count}} interview questions
    for a {{difficulty}} difficulty {{type}} interview for a {{category}} role.
    Base questions on the candidate's resume and job requirements.
  </context>
  
  <candidate_background>
    {{resume_summary}}
  </candidate_background>
  
  <job_requirements>
    {{job_requirements}}
  </job_requirements>
  
  <instructions>
    Generate questions that:
    - Are specific to the candidate's experience level
    - Cover core {{category}} concepts
    - Include follow-up hints to guide the conversation
    - Have verifiable expected answers
    
    Respond in valid JSON:
    {
      "questions": [
        {
          "content": string,
          "expectedAnswer": string,
          "hints": string[],
          "followUpQuestions": string[],
          "difficulty": "EASY" | "MEDIUM" | "HARD",
          "category": string
        }
      ]
    }
  </instructions>
</question_generation>`,
      variables: ['count', 'difficulty', 'type', 'category', 'resume_summary', 'job_requirements'],
      isActive: true,
    },
  });

  console.log(`✅ Seeded users: admin=${admin.id}, user=${testUser.id}`);
  console.log('✅ Seeded initial prompts');
  console.log('\n🔑 Dev credentials:');
  console.log('  Admin: admin@ai-interview.dev / Admin123!');
  console.log('  User:  user@ai-interview.dev / User123!');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
