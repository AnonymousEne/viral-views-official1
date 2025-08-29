import { MailService } from '@sendgrid/mail';
import type { User } from '@shared/schema';

// Initialize SendGrid (will be configured when API key is provided)
let mailService: MailService | null = null;

function initializeEmailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY not provided - email functionality disabled");
    return false;
  }

  try {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("✅ SendGrid email service initialized");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize SendGrid:", error);
    return false;
  }
}

// Initialize on startup
initializeEmailService();

export async function sendWelcomeEmail(user: User): Promise<boolean> {
  if (!mailService || !process.env.SENDGRID_API_KEY) {
    console.log("📧 Email service not available - skipping welcome email for", user.username);
    return false;
  }

  try {
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header { 
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); 
              color: white; 
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-size: 18px;
            }
            .content { 
              padding: 40px 30px;
            }
            .welcome-box {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 25px;
              border-radius: 10px;
              margin: 20px 0;
              text-align: center;
            }
            .username {
              font-size: 24px;
              font-weight: bold;
              color: #9333ea;
              margin: 10px 0;
            }
            .features {
              margin: 30px 0;
            }
            .feature {
              display: flex;
              align-items: center;
              margin: 15px 0;
              padding: 10px;
            }
            .feature-icon {
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              color: white;
              font-weight: bold;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              background: #1f2937;
              color: #9ca3af;
              padding: 30px;
              text-align: center;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Welcome to Viral Views! 🎵</h1>
              <p>Where Music Goes Viral</p>
            </div>
            
            <div class="content">
              <h2>Hey there, music creator! 🎤</h2>
              
              <div class="welcome-box">
                <p>Your account has been successfully created!</p>
                <div class="username">@${user.username}</div>
                <p>You're now part of the ultimate music collaboration platform!</p>
              </div>

              <p>Welcome to <strong>Viral Views</strong> - the premier platform for rap battles, beat production, and real-time music collaboration. You're about to join a community of talented ${user.role}s who are pushing the boundaries of music creation.</p>

              <div class="features">
                <h3>🚀 What you can do now:</h3>
                
                <div class="feature">
                  <div class="feature-icon">🎤</div>
                  <div>
                    <strong>Join Rap Battles</strong><br>
                    Compete against other artists in live freestyle competitions
                  </div>
                </div>

                <div class="feature">
                  <div class="feature-icon">🎵</div>
                  <div>
                    <strong>Create & Share Beats</strong><br>
                    Upload your productions and monetize through our marketplace
                  </div>
                </div>

                <div class="feature">
                  <div class="feature-icon">🤝</div>
                  <div>
                    <strong>Real-time Collaboration</strong><br>
                    Work with other artists on tracks and remixes
                  </div>
                </div>

                <div class="feature">
                  <div class="feature-icon">📺</div>
                  <div>
                    <strong>Live Streaming</strong><br>
                    Broadcast your sessions and build your fanbase
                  </div>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://viralviews.com'}" class="cta-button">
                  🎵 Start Creating Now! ✨
                </a>
              </div>

              <p><strong>Your role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} 🎯</p>
              
              <p>Need help getting started? Our platform is intuitive and designed for creators like you. Explore the different sections, connect with other artists, and let your creativity flow!</p>
            </div>

            <div class="footer">
              <p><strong>Viral Views</strong> - Where Music Goes Viral</p>
              <p>© 2025 Viral Views. Ready to make your mark in the music world? 🌟</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const welcomeText = `
🎵 Welcome to Viral Views - Where Music Goes Viral! 🎵

Hey @${user.username}!

Your account has been successfully created as a ${user.role}! You're now part of the ultimate music collaboration platform.

What you can do now:
🎤 Join Rap Battles - Compete in live freestyle competitions
🎵 Create & Share Beats - Upload and monetize your productions  
🤝 Real-time Collaboration - Work with other artists on tracks
📺 Live Streaming - Broadcast sessions and build your fanbase

Ready to start creating? Log in now and explore all the features!

- The Viral Views Team
Where Music Goes Viral ✨
    `;

    await mailService.send({
      to: user.email!,
      from: {
        email: 'welcome@viralviews.com',
        name: 'Viral Views Team'
      },
      subject: `🎵 Welcome to Viral Views, @${user.username}! Your music journey starts now 🎵`,
      text: welcomeText,
      html: welcomeHtml,
    });

    console.log(`✅ Welcome email sent to ${user.email} (@${user.username})`);
    return true;

  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    return false;
  }
}

export async function sendEmailVerification(user: User, verificationCode: string): Promise<boolean> {
  if (!mailService || !process.env.SENDGRID_API_KEY) {
    console.log("📧 Email service not available - skipping verification email");
    return false;
  }

  try {
    const verificationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; }
            .verification-code { font-size: 32px; font-weight: bold; text-align: center; background: #f3f4f6; padding: 20px; border-radius: 10px; letter-spacing: 3px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎵 Verify Your Viral Views Account</h1>
            </div>
            <div class="content">
              <h2>Hey @${user.username}!</h2>
              <p>Please use this verification code to complete your account setup:</p>
              <div class="verification-code">${verificationCode}</div>
              <p>This code expires in 10 minutes for security purposes.</p>
              <p>If you didn't create this account, please ignore this email.</p>
              <p>Welcome to the music community! 🎤</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await mailService.send({
      to: user.email!,
      from: {
        email: 'verify@viralviews.com', 
        name: 'Viral Views Verification'
      },
      subject: `🔐 Verify your Viral Views account @${user.username}`,
      html: verificationHtml,
      text: `Verify your Viral Views account @${user.username}\n\nVerification code: ${verificationCode}\n\nThis code expires in 10 minutes.`
    });

    console.log(`✅ Verification email sent to ${user.email}`);
    return true;

  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    return false;
  }
}

// Re-initialize email service when environment changes
export function reinitializeEmailService() {
  return initializeEmailService();
}