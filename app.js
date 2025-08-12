const { 
  default: makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  downloadMediaMessage 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const configPath = './config.json';
let config = JSON.parse(fs.readFileSync(configPath));

const isViewOnce = (message) => {
    if (!message) return false;
    if (message.viewOnceMessage || message.viewOnceMessageV2) {
      return true;
    }
    const mediaMessage = message.imageMessage || message.videoMessage;
    if (mediaMessage && mediaMessage.viewOnce === true) {
      return true;
    }
    return false;
};
  
const handleViewOnce = async (m, sock) => {
    // Logika pemicu tetap sama, bot akan merespons semua orang
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) 
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() 
      : '';
      
    const isReaction = m.message?.reactionMessage;
    const containsEmoji = m.body && /[\p{Emoji}]/u.test(m.body);
    const isQuotedMsgViewOnce = isViewOnce(m.quoted?.message);
  
    const reactedToViewOnce = isReaction && isQuotedMsgViewOnce;
    const isEmojiReply = containsEmoji && isQuotedMsgViewOnce;
    const isTriggeredByCmd = cmd === 'view' && isQuotedMsgViewOnce;
    
    const isTriggered = isTriggeredByCmd || isEmojiReply || reactedToViewOnce;
  
    if (!isTriggered) return;
  
    if (!m.quoted) return;
    
    let msg = m.quoted.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    else if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
  
    const messageType = msg ? Object.keys(msg)[0] : null;
    const isMedia = messageType && ['imageMessage', 'videoMessage', 'audioMessage'].includes(messageType);
    
    if (!isMedia) return;
  
    try {
      const buffer = await downloadMediaMessage(m.quoted, 'buffer', {}, {
          logger: pino({ level: 'silent' })
      });
          
      if (!buffer) return;
  
      const originalSenderJid = m.quoted.key.participant || m.quoted.key.remoteJid;
      const senderNumber = originalSenderJid.split('@')[0];
      const caption = `> *Media sekali-lihat dari ${senderNumber} berhasil dibuka.*`;
      
      // ==========================================================
      // PERUBAHAN UTAMA DI SINI
      // Tujuan pengiriman sekarang mengambil dari file konfigurasi
      const recipient = config.TARGET_GROUP_ID;
      
      // Pengecekan untuk memastikan grup target sudah diatur
      if (!recipient || !recipient.endsWith('@g.us')) {
          console.error('[ERROR] Target Group ID is not valid or not set. Please use .setgroup command.');
          // Memberi tahu pengguna bahwa grup target belum diatur
          m.reply('Tujuan grup belum diatur. Masuk ke grup target Anda, lalu ketik .setgroup');
          return;
      }
      // ==========================================================
  
      if (messageType === 'imageMessage') {
        await sock.sendMessage(recipient, { image: buffer, caption: caption });
      } else if (messageType === 'videoMessage') {
        await sock.sendMessage(recipient, { video: buffer, mimetype: 'video/mp4', caption: caption });
      } else if (messageType === 'audioMessage') {  
        await sock.sendMessage(recipient, { audio: buffer, mimetype: 'audio/ogg', ptt: true });
      }
  
      console.log(`[SUCCESS] Success bypassing view-once and sent to target group ${recipient}.`);
  
    } catch (error) {
      console.error('[ERROR] Failed to bypass media view-once:', error);
    }
};

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['Bot View Once', 'WulungOS', '1.0.0']
  });
  
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
        qrcode.generate(qr, { small: true });
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('[INFO] WhatsApp Disconnect, Reason:', lastDisconnect.error, 'Try Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('[SUCCESS] WhatsApp Connected!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];

    if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

    const getBody = (message) => {
        if (message?.conversation) return message.conversation;
        if (message?.extendedTextMessage) return message.extendedTextMessage.text;
        if (message?.imageMessage?.caption) return message.imageMessage.caption;
        if (message?.videoMessage?.caption) return message.videoMessage.caption;
        if (message?.reactionMessage?.text) return message.reactionMessage.text;
        return '';
    };

    const simpleM = {
      ...msg,
      sender: msg.key.remoteJid.endsWith('@g.us') ? msg.key.participant : msg.key.remoteJid,
      from: msg.key.remoteJid,
      body: getBody(msg.message),
      message: msg.message,
      quoted: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? {
        key: {
            remoteJid: msg.message.extendedTextMessage.contextInfo.remoteJid,
            participant: msg.message.extendedTextMessage.contextInfo.participant,
            id: msg.message.extendedTextMessage.contextInfo.stanzaId
        },
        message: msg.message.extendedTextMessage.contextInfo.quotedMessage
      } : null,
      reply: (text) => sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg })
    };
    
    const command = simpleM.body.toLowerCase();
    
    if (command === '.setgroup') { 
        if (simpleM.from.endsWith('@g.us')) {
            const newGroupId = simpleM.from;
            config.TARGET_GROUP_ID = newGroupId;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            console.log(`[SUCCESS] Target group has been set to: ${newGroupId}`);
            simpleM.reply(`✅ Berhasil! Grup ini sekarang telah ditetapkan sebagai target.`);
        } else {
            simpleM.reply('❌ Perintah ini hanya bisa digunakan di dalam grup.');
        }
        return; 
    }
    
    try {
      await handleViewOnce(simpleM, sock);
    } catch (e) {
      console.error('[ERROR] Failed proccessing message, detail:', e);
    }
  });
}

connectToWhatsApp();
