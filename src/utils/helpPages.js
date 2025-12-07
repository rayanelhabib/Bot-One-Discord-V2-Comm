// Pages de détail pour le système d'aide
const detailPages = {
  commands: {
    title: '🔊 Voice Channel Commands',
    content: `
# 🔊 Voice Channel Commands

> **Manage your temporary voice channels with ease!**

---

## ➡️ Channel Management
🔈 **\`.v name <name>\`** — Rename your channel
👥 **\`.v limit <number>\`** — Limit users
♻️ **\`.v reset\`** — Reset channel settings
ℹ️ **\`.v vcinfo\`** — Channel info
👑 **\`.v owner\`** — View owner
📝 **\`.v status [emoji] [text]\`** — Set channel status
🧹 **\`.v clear\`** — Kick all users

---

## ➡️ Access Control
🔒 **\`.v lock\`** — Lock channel
🔓 **\`.v unlock\`** — Unlock channel
🙈 **\`.v hide\`** — Hide channel (Premium)
👁️ **\`.v unhide\`** — Unhide channel (Premium)
✅ **\`.v permit @user\`** — Permit user
⛔ **\`.v reject @user\`** — Reject user
🟢 **\`.v permitrole @role\`** — Permit role
🔴 **\`.v rejectrole @role\`** — Reject role
💬 **\`.v tlock\`** — Lock chat
💬 **\`.v tunlock\`** — Unlock chat
📩 **\`.v request\`** — Request access

---

## ➡️ User Management
👢 **\`.v kick @user\`** — Kick user
🔇 **\`.v fm\`** — Mute all
🔊 **\`.v funm\`** — Unmute all
🏆 **\`.v claim\`** — Claim ownership
👑 **\`.v transfer @user\`** — Transfer ownership
📋 **\`+task\`** — Start task timer (only for staff)

---

> **💡 Use \`.v help <command>\` for more details on each command.**
    `,
    footer: 'OneTab - Voice management | Use .v help commands'
  },
  features: {
    title: '✨ Voice Channel Features',
    content: `
# ✨ Voice Channel Features

> **Enhance your voice experience with extra features!**

---

## ✨ Activities
**\`.v activity on\`** — Enable activities
> Watch Together, Poker Night, Chess, and more interactive activities.

---

## 📷 Camera
**\`.v cam on\`** — Enable camera
> Allow video sharing in your voice channel.

---

## 😤 Streaming
**\`.v stream on\`** — Enable stream
> Enable screen sharing and streaming capabilities.

---

## 🔊 Soundboard
**\`.v sb on\`** — Enable soundboard
> Play sound effects and music through the soundboard.

---

## 🔧 To disable any feature:
**\`.v activity off\`**, **\`.v cam off\`**, **\`.v stream off\`**, **\`.v sb off\`**

---

✨ **Try these features in your voice channel!**

## 💡 Tips
• Activities require 2+ users to work properly
• Some features may need specific permissions
• Great for gaming sessions and group activities
    `,
    footer: 'OneTab - Voice management | Use .v help features'
  },
  blacklist: {
    title: '⛔ Blacklist System',
    content: `
# ⛔ Blacklist System

> **Block users from joining your voice channels!**

---

## ➕ Add to Blacklist
**\`.v blacklist add @user\`** or **\`.v bl add @user\`**
> Add a user to your blacklist (they will be blocked from your future VCs).

---

## ➖ Remove from Blacklist
**\`.v blacklist remove @user\`** or **\`.v bl remove @user\`**
> Remove a user from your blacklist.

---

## 📋 View Blacklist
**\`.v blacklist list\`** or **\`.v bl list\`**
> View your blacklist.

---

## 🧹 Clear Blacklist
**\`.v blacklist clear\`** or **\`.v bl clear\`**
> Clear your blacklist.

---

⚠️ **Blacklist applies to all temporary VCs you create.**

## 💡 Tips
• Use blacklist to keep unwanted users out
• Combine with whitelist for maximum control
• Blacklist is server-wide for your channels
    `,
    footer: 'OneTab - Voice management | Use .v blacklist or .v bl'
  },
  whitelist: {
    title: '✅ Whitelist System',
    content: `
# ✅ Whitelist System

> **Allow only trusted users to join your voice channels!**

---

## ➕ Add to Whitelist
**\`.v whitelist add @user\`** or **\`.v wl add @user\`**
> Add a user to your whitelist (they will always be able to join your VCs).

---

## ➖ Remove from Whitelist
**\`.v whitelist remove @user\`** or **\`.v wl remove @user\`**
> Remove a user from your whitelist.

---

## 📋 View Whitelist
**\`.v whitelist list\`** or **\`.v wl list\`**
> View your whitelist.

---

## 🧹 Clear Whitelist
**\`.v whitelist clear\`** or **\`.v wl clear\`**
> Clear your whitelist.

---

⚠️ **Whitelist applies to all temporary VCs you create.**

## 💡 Tips
• Use whitelist for exclusive channels
• Perfect for private meetings or events
• Whitelist overrides blacklist for specific users
    `,
    footer: 'OneTab - Voice management | Use .v whitelist or .v wl'
  },
  manager: {
    title: '🤝 Manager (Co-Owner) System',
    content: `
# 🤝 Manager (Co-Owner) System

> **Easily share channel management with trusted users!**

---

## ➕ Add Manager
**\`.v manager add @user\`** or **\`.v man add @user\`**
> Add a user as manager (co-owner) of your voice channel.

---

## ➖ Remove Manager
**\`.v manager remove @user\`** or **\`.v man remove @user\`**
> Remove a user from your managers.

---

## 🧹 Clear Managers
**\`.v manager clear\`** or **\`.v man clear\`**
> Remove all managers from your channel.

---

## 📋 Show Managers
**\`.v manager show\`** or **\`.v man show\`**
> List all current managers (co-owners) of your channel.

---

## 🎯 Managers can:
- Manage the channel (rename, limit, kick, mute, etc.)
- Help you moderate your voice room
- Use all voice commands except transfer ownership

---

⚠️ **Only the channel owner can manage the managers list.**

## 💡 Tips
• Choose trusted friends as managers
• Managers can help moderate when you're away
• Perfect for team leaders and moderators
    `,
    footer: 'OneTab - Voice management | Use .v manager or .v man'
  },
  setup: {
    title: '🛠️ Setup Commands',
    content: `
# 🛠️ Setup Commands

> **Server administrators can configure the bot for your community.**

---

## 🛠️ Setup Process
**\`.v setup\`** — Start the setup process
> Interactive setup wizard to configure voice channel creation.

---

## 🎯 Setup includes:
- Voice channel creation settings
- Permission configurations
- Role assignments
- Channel naming patterns

---

## 📋 Requirements:
- Administrator permissions
- Manage channels permission
- Manage roles permission

---

⚙️ **More setup options coming soon!**

## 💡 Tips
• Run setup in a dedicated admin channel
• Test the setup with a few users first
• Keep backup of your current settings
    `,
    footer: 'OneTab - Voice management | Use .v help setup'
  },
  admin: {
    title: '🛡️ Admin Commands',
    content: `
# 🛡️ Admin Commands

> **Reserved for server administrators.**

---

## 🛡️ Admin Panel
**\`.v admin\`** — Admin panel (coming soon)
> Server-wide voice channel management and analytics.

---

## 🚀 Future admin features:
- Server-wide voice channel overview
- User permission management
- Bot configuration settings
- Analytics and statistics
- Advanced moderation tools

---

🔒 **Only users with admin permissions can use these commands.**

## 💡 Tips
• Admin panel will provide detailed server insights
• Monitor voice channel usage and activity
• Manage bot settings across the entire server
    `,
    footer: 'OneTab - Voice management | Use .v help admin'
  },
  task: {
    title: '📋 Task System (Special Prefix)',
    content: `
# 📋 Task System (Special Prefix)

> **Staff task management system for voice channel activities!**

⚠️ **Note:** This command uses the special prefix **\`+\`** instead of **\`.v\`**

---

## 📋 Start Task Timer
**\`+task\`** — Start task timer
> Start a 20-minute timer when you have 5+ members in your VC.

---

## 📋 Automatic Completion
**\`+task\`** — AUTOMATIC completion
> Tasks are automatically counted after 20 minutes! No need to claim.

---

## 📋 View Statistics
**\`+task list\`** — View task statistics
> View all staff members and their completed tasks (High roles only).

---

## 🧹 Reset Data
**\`+task clear\`** — Reset task data
> Clear all task data from the server (Owners only).

---

## 🏆 Leaderboard
**\`+leaderboard\`** — View task leaderboard
> View the top 10 staff members by completed tasks (High roles only).

---

## 📋 Requirements to start a task:
• Must be in a voice channel
• Must have staff role
• Must be the channel creator
• Must have 5+ members in the channel

---

## ⏰ Process:
1. Use **\`+task\`** to start the timer
2. Stay 20 minutes with 5+ members
3. ✅ **AUTOMATIC:** Task is automatically counted!

---

## 💡 Tips
• Perfect for staff activity tracking
• Great for community engagement
• Monitor staff performance and activity
• ✅ **Fully automatic** - no manual claiming needed!
    `,
    footer: 'OneTab - Voice management | Use .v help task'
  }
};

module.exports = { detailPages };
