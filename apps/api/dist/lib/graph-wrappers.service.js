import { EventEmitter } from 'events';
import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';
export class GraphWrappersService extends EventEmitter {
    outbox = new Map();
    DEMO_MODE = !process.env.AZURE_CLIENT_ID;
    CACHE_TTL = 300;
    constructor() {
        super();
        this.initializeDemoData();
    }
    initializeDemoData() {
        if (this.DEMO_MODE) {
            structuredLogger.info('Graph Wrappers Service initialized in demo mode', {
                requestId: ''
            });
        }
    }
    async getUsers(organizationId) {
        const cacheKey = `graph_users_${organizationId}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoUsers = [
                {
                    id: 'user_1',
                    displayName: 'Juan Pérez',
                    mail: 'juan.perez@demo-org.com',
                    userPrincipalName: 'juan.perez@demo-org.com',
                    jobTitle: 'CEO',
                    department: 'Executive',
                    officeLocation: 'Madrid',
                    businessPhones: ['+34 91 123 4567'],
                    mobilePhone: '+34 600 123 456'
                },
                {
                    id: 'user_2',
                    displayName: 'María García',
                    mail: 'maria.garcia@demo-org.com',
                    userPrincipalName: 'maria.garcia@demo-org.com',
                    jobTitle: 'CTO',
                    department: 'Technology',
                    officeLocation: 'Barcelona',
                    businessPhones: ['+34 93 123 4567'],
                    mobilePhone: '+34 600 234 567'
                },
                {
                    id: 'user_3',
                    displayName: 'Carlos López',
                    mail: 'carlos.lopez@demo-org.com',
                    userPrincipalName: 'carlos.lopez@demo-org.com',
                    jobTitle: 'Sales Manager',
                    department: 'Sales',
                    officeLocation: 'Valencia',
                    businessPhones: ['+34 96 123 4567'],
                    mobilePhone: '+34 600 345 678'
                }
            ];
            apiCache.set(cacheKey, demoUsers, this.CACHE_TTL);
            return demoUsers;
        }
        throw new Error('Azure Graph API not configured');
    }
    async getUser(userId, organizationId) {
        const users = await this.getUsers(organizationId);
        return users.find(user => user.id === userId) || null;
    }
    async getMessages(organizationId, userId, limit = 50) {
        const cacheKey = `graph_messages_${organizationId}_${userId}_${limit}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoMessages = [
                {
                    id: 'msg_1',
                    subject: 'Reunión de equipo - Q4 Planning',
                    body: {
                        content: 'Hola equipo,<br><br>Tenemos una reunión programada para el próximo viernes a las 10:00 AM para revisar la planificación del Q4.<br><br>Saludos,<br>Juan',
                        contentType: 'html'
                    },
                    from: {
                        emailAddress: {
                            name: 'Juan Pérez',
                            address: 'juan.perez@demo-org.com'
                        }
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                name: 'María García',
                                address: 'maria.garcia@demo-org.com'
                            }
                        }
                    ],
                    receivedDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    isRead: true,
                    hasAttachments: false
                },
                {
                    id: 'msg_2',
                    subject: 'Propuesta de proyecto - Nuevo cliente',
                    body: {
                        content: 'Estimado equipo,<br><br>Adjunto encontrarán la propuesta para el nuevo cliente que hemos estado discutiendo.<br><br>Por favor, revisen y envíen sus comentarios antes del viernes.<br><br>Gracias,<br>Carlos',
                        contentType: 'html'
                    },
                    from: {
                        emailAddress: {
                            name: 'Carlos López',
                            address: 'carlos.lopez@demo-org.com'
                        }
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                name: 'María García',
                                address: 'maria.garcia@demo-org.com'
                            }
                        }
                    ],
                    receivedDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    isRead: false,
                    hasAttachments: true
                }
            ];
            apiCache.set(cacheKey, demoMessages, this.CACHE_TTL);
            return demoMessages;
        }
        throw new Error('Azure Graph API not configured');
    }
    async getCalendarEvents(organizationId, userId, startDate, endDate) {
        const cacheKey = `graph_calendar_${organizationId}_${userId}_${startDate}_${endDate}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoEvents = [
                {
                    id: 'event_1',
                    subject: 'Reunión de equipo semanal',
                    start: {
                        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                        timeZone: 'Europe/Madrid'
                    },
                    end: {
                        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
                        timeZone: 'Europe/Madrid'
                    },
                    location: {
                        displayName: 'Sala de conferencias A'
                    },
                    attendees: [
                        {
                            emailAddress: {
                                name: 'Juan Pérez',
                                address: 'juan.perez@demo-org.com'
                            },
                            type: 'required'
                        },
                        {
                            emailAddress: {
                                name: 'María García',
                                address: 'maria.garcia@demo-org.com'
                            },
                            type: 'required'
                        }
                    ],
                    isOnlineMeeting: true,
                    onlineMeetingProvider: 'teamsForBusiness'
                },
                {
                    id: 'event_2',
                    subject: 'Presentación cliente - Proyecto Alpha',
                    start: {
                        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                        timeZone: 'Europe/Madrid'
                    },
                    end: {
                        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
                        timeZone: 'Europe/Madrid'
                    },
                    location: {
                        displayName: 'Oficina principal'
                    },
                    attendees: [
                        {
                            emailAddress: {
                                name: 'Carlos López',
                                address: 'carlos.lopez@demo-org.com'
                            },
                            type: 'required'
                        }
                    ],
                    isOnlineMeeting: false
                }
            ];
            apiCache.set(cacheKey, demoEvents, this.CACHE_TTL);
            return demoEvents;
        }
        throw new Error('Azure Graph API not configured');
    }
    async getDriveItems(organizationId, userId, folderId) {
        const cacheKey = `graph_drive_${organizationId}_${userId}_${folderId || 'root'}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoItems = [
                {
                    id: 'item_1',
                    name: 'Propuesta_Cliente_2024.pdf',
                    size: 2048576,
                    lastModifiedDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    webUrl: 'https://demo-org.sharepoint.com/sites/demo/Documents/Propuesta_Cliente_2024.pdf',
                    downloadUrl: 'https://demo-org.sharepoint.com/sites/demo/Documents/Propuesta_Cliente_2024.pdf',
                    file: {
                        mimeType: 'application/pdf',
                        hashes: {
                            sha1Hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
                            sha256Hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
                        }
                    }
                },
                {
                    id: 'item_2',
                    name: 'Presentaciones',
                    size: 0,
                    lastModifiedDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    webUrl: 'https://demo-org.sharepoint.com/sites/demo/Documents/Presentaciones',
                    folder: {
                        childCount: 5
                    }
                }
            ];
            apiCache.set(cacheKey, demoItems, this.CACHE_TTL);
            return demoItems;
        }
        throw new Error('Azure Graph API not configured');
    }
    async getTeams(organizationId) {
        const cacheKey = `graph_teams_${organizationId}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoTeams = [
                {
                    id: 'team_1',
                    displayName: 'Equipo de Desarrollo',
                    description: 'Equipo encargado del desarrollo de productos',
                    createdDateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    webUrl: 'https://teams.microsoft.com/l/team/team_1',
                    members: [
                        {
                            id: 'user_2',
                            displayName: 'María García',
                            roles: ['owner']
                        },
                        {
                            id: 'user_3',
                            displayName: 'Carlos López',
                            roles: ['member']
                        }
                    ]
                },
                {
                    id: 'team_2',
                    displayName: 'Equipo de Ventas',
                    description: 'Equipo de ventas y desarrollo comercial',
                    createdDateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    webUrl: 'https://teams.microsoft.com/l/team/team_2',
                    members: [
                        {
                            id: 'user_1',
                            displayName: 'Juan Pérez',
                            roles: ['owner']
                        },
                        {
                            id: 'user_3',
                            displayName: 'Carlos López',
                            roles: ['member']
                        }
                    ]
                }
            ];
            apiCache.set(cacheKey, demoTeams, this.CACHE_TTL);
            return demoTeams;
        }
        throw new Error('Azure Graph API not configured');
    }
    async getTeamChannels(teamId, organizationId) {
        const cacheKey = `graph_channels_${teamId}_${organizationId}`;
        const cached = apiCache.get(cacheKey);
        if (cached) {
            return cached;
        }
        if (this.DEMO_MODE) {
            const demoChannels = [
                {
                    id: 'channel_1',
                    displayName: 'General',
                    description: 'Canal general del equipo',
                    membershipType: 'standard',
                    webUrl: 'https://teams.microsoft.com/l/channel/channel_1',
                    messages: [
                        {
                            id: 'msg_1',
                            body: {
                                content: '¡Hola equipo! ¿Cómo va el proyecto?',
                                contentType: 'text'
                            },
                            from: {
                                user: {
                                    displayName: 'María García',
                                    id: 'user_2'
                                }
                            },
                            createdDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            id: 'msg_2',
                            body: {
                                content: 'Todo va bien, gracias por preguntar. Tenemos el demo listo para el viernes.',
                                contentType: 'text'
                            },
                            from: {
                                user: {
                                    displayName: 'Carlos López',
                                    id: 'user_3'
                                }
                            },
                            createdDateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
                        }
                    ]
                }
            ];
            apiCache.set(cacheKey, demoChannels, this.CACHE_TTL);
            return demoChannels;
        }
        throw new Error('Azure Graph API not configured');
    }
    async addToOutbox(message) {
        const id = `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const outboxMessage = {
            ...message,
            id,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        this.outbox.set(id, outboxMessage);
        structuredLogger.info('Message added to outbox', {
            messageId: id,
            subject: message.subject,
            toRecipients: message.toRecipients.length,
            requestId: ''
        });
        this.emit('messageAddedToOutbox', outboxMessage);
        return outboxMessage;
    }
    async getOutboxMessages(organizationId, status) {
        let messages = Array.from(this.outbox.values());
        if (status) {
            messages = messages.filter(msg => msg.status === status);
        }
        return messages;
    }
    async sendOutboxMessage(messageId) {
        const message = this.outbox.get(messageId);
        if (!message) {
            throw new Error(`Message not found in outbox: ${messageId}`);
        }
        if (message.status !== 'pending') {
            throw new Error(`Message is not in pending status: ${message.status}`);
        }
        if (this.DEMO_MODE) {
            message.status = 'sent';
            structuredLogger.info('Message sent (demo mode)', {
                messageId,
                subject: message.subject,
                toRecipients: message.toRecipients.length,
                requestId: ''
            });
            this.emit('messageSent', message);
            return true;
        }
        throw new Error('Azure Graph API not configured');
    }
    async cancelOutboxMessage(messageId) {
        const message = this.outbox.get(messageId);
        if (!message) {
            throw new Error(`Message not found in outbox: ${messageId}`);
        }
        if (message.status !== 'pending') {
            throw new Error(`Message cannot be cancelled: ${message.status}`);
        }
        message.status = 'cancelled';
        structuredLogger.info('Message cancelled', {
            messageId,
            subject: message.subject,
            requestId: ''
        });
        this.emit('messageCancelled', message);
        return true;
    }
    async getHealth() {
        const outboxCount = this.outbox.size;
        const cacheStats = apiCache.getStats();
        return {
            status: 'ok',
            mode: this.DEMO_MODE ? 'demo' : 'azure',
            outboxCount,
            cacheStats
        };
    }
}
export const graphWrappersService = new GraphWrappersService();
//# sourceMappingURL=graph-wrappers.service.js.map