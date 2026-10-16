const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const senha = bcrypt.hashSync('Demo@1234', 10);

async function main() {
  const users = [
    { email: 'admin@demo.app', name: 'Administrador Demo', role: 'admin' },
    { email: 'cliente@demo.app', name: 'Cliente Demo', role: 'cliente' },
    { email: 'operador@demo.app', name: 'Operador Demo', role: 'operador' },
    { email: 'tecnico@demo.app', name: 'Técnico Demo', role: 'tecnico' },
    { email: 'jogador@demo.app', name: 'Jogador Demo', role: 'user' },
  ];
  const createdUsers = {};
  try {
    for (const u of users) {
      createdUsers[u.role] = await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { email: u.email, name: u.name, passwordHash: senha, role: u.role, plan: 'free' },
      });
    }
  } catch (e) { console.warn('[seed] pulou User:', e.message); }

  let client;
  try {
    client = await prisma.client.upsert({
      where: { id: 'demo-client-001' },
      update: {},
      create: {
        id: 'demo-client-001', name: 'Condomínio Jardim das Palmeiras', document: '12.345.678/0001-90',
        contactName: 'Marcos Andrade', contactEmail: 'sindico@jardimdasPalmeiras.com.br', contactPhone: '(11) 98765-4321',
        address: 'Av. Paulista, 1500', city: 'São Paulo', state: 'SP', zipCode: '01310-100', status: 'ativo',
        notes: 'Cliente de demonstração com 2 sites ativos.',
      },
    });
  } catch (e) { console.warn('[seed] pulou Client:', e.message); }

  let site1, site2;
  try {
    site1 = await prisma.site.upsert({
      where: { id: 'demo-site-001' },
      update: {},
      create: {
        id: 'demo-site-001', clientId: client.id, name: 'Portaria Principal', code: 'SP-001',
        address: 'Av. Paulista, 1500', city: 'São Paulo', state: 'SP', zipCode: '01310-100',
        latitude: -23.5613, longitude: -46.6565, timezone: 'America/Sao_Paulo', status: 'ativo',
      },
    });
    site2 = await prisma.site.upsert({
      where: { id: 'demo-site-002' },
      update: {},
      create: {
        id: 'demo-site-002', clientId: client.id, name: 'Garagem Subsolo', code: 'SP-002',
        address: 'Av. Paulista, 1500', city: 'São Paulo', state: 'SP', zipCode: '01310-100',
        latitude: -23.5620, longitude: -46.6570, timezone: 'America/Sao_Paulo', status: 'ativo',
      },
    });
  } catch (e) { console.warn('[seed] pulou Site:', e.message); }

  let cam1, cam2, cam3;
  try {
    cam1 = await prisma.camera.upsert({
      where: { id: 'demo-cam-001' },
      update: {},
      create: {
        id: 'demo-cam-001', siteId: site1.id, name: 'Entrada Principal', code: 'CAM-001',
        rtspUrl: 'rtsp://demo.local/cam1', manufacturer: 'Intelbras', model: 'VIP 3230', serialNumber: 'INT-3230-001',
        resolution: '1080p', status: 'online', lastSeenAt: new Date(), lastLatencyMs: 45, healthStatus: 'ok', healthCheckedAt: new Date(),
      },
    });
    cam2 = await prisma.camera.upsert({
      where: { id: 'demo-cam-002' },
      update: {},
      create: {
        id: 'demo-cam-002', siteId: site1.id, name: 'Recepção', code: 'CAM-002',
        rtspUrl: 'rtsp://demo.local/cam2', manufacturer: 'Hikvision', model: 'DS-2CD2143', serialNumber: 'HIK-2143-002',
        resolution: '1080p', status: 'online', lastSeenAt: new Date(), lastLatencyMs: 62, healthStatus: 'ok', healthCheckedAt: new Date(),
      },
    });
    cam3 = await prisma.camera.upsert({
      where: { id: 'demo-cam-003' },
      update: {},
      create: {
        id: 'demo-cam-003', siteId: site2.id, name: 'Garagem B1', code: 'CAM-003',
        rtspUrl: 'rtsp://demo.local/cam3', manufacturer: 'Intelbras', model: 'VIP 1230', serialNumber: 'INT-1230-003',
        resolution: '720p', status: 'degradada', lastSeenAt: new Date(), lastLatencyMs: 320, healthStatus: 'warn', healthCheckedAt: new Date(),
      },
    });
  } catch (e) { console.warn('[seed] pulou Camera:', e.message); }

  try {
    const n = await prisma.cameraHealthCheck.count();
    if (n === 0) await prisma.cameraHealthCheck.createMany({ data: [
      { cameraId: cam1.id, status: 'online', latencyMs: 45, message: 'OK', checkedAt: new Date() },
      { cameraId: cam2.id, status: 'online', latencyMs: 62, message: 'OK', checkedAt: new Date() },
      { cameraId: cam3.id, status: 'degradada', latencyMs: 320, message: 'Latência alta', checkedAt: new Date() },
    ]});
  } catch (e) { console.warn('[seed] pulou CameraHealthCheck:', e.message); }

  let sensor1, sensor2;
  try {
    sensor1 = await prisma.sensor.upsert({
      where: { id: 'demo-sensor-001' },
      update: {},
      create: { id: 'demo-sensor-001', siteId: site1.id, name: 'Sensor Porta Principal', type: 'porta', serialNumber: 'SEN-PORTA-001', status: 'online', lastSeenAt: new Date(), metadata: { fabricante: 'Intelbras' } },
    });
    sensor2 = await prisma.sensor.upsert({
      where: { id: 'demo-sensor-002' },
      update: {},
      create: { id: 'demo-sensor-002', siteId: site2.id, name: 'Sensor Fumaça B1', type: 'fumaca', serialNumber: 'SEN-FUMO-002', status: 'online', lastSeenAt: new Date(), metadata: { fabricante: 'Bosch' } },
    });
  } catch (e) { console.warn('[seed] pulou Sensor:', e.message); }

  let rule1;
  try {
    rule1 = await prisma.detectionRule.upsert({
      where: { id: 'demo-rule-001' },
      update: {},
      create: {
        id: 'demo-rule-001', cameraId: cam1.id, name: 'Detecção de Pessoas - Entrada', enabled: true,
        zone: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }, scheduleStart: '00:00', scheduleEnd: '23:59',
        daysOfWeek: '1,2,3,4,5,6,7', sensitivity: 0.7, objectClasses: 'pessoa', minConfidence: 0.6, cooldownSeconds: 30,
      },
    });
  } catch (e) { console.warn('[seed] pulou DetectionRule:', e.message); }

  try {
    const n = await prisma.event.count();
    if (n === 0) {
      const now = Date.now();
      const events = [];
      for (let i = 0; i < 12; i++) {
        events.push({
          siteId: i % 2 === 0 ? site1.id : site2.id,
          cameraId: i % 3 === 0 ? cam1.id : (i % 3 === 1 ? cam2.id : cam3.id),
          detectionRuleId: i % 3 === 0 ? rule1.id : null,
          occurredAt: new Date(now - i * 3600000),
          snapshotUrl: `https://demo.local/snap/${i}.jpg`,
          motionScore: 0.5 + (i % 5) * 0.1,
          aiLabel: ['pessoa', 'veiculo', 'objeto', 'desconhecido'][i % 4],
          aiConfidence: 0.7 + (i % 3) * 0.05,
          status: ['novo', 'em_analise', 'classificado', 'descartado'][i % 4],
          classification: ['pessoa', 'veiculo', 'objeto', 'desconhecido'][i % 4],
        });
      }
      await prisma.event.createMany({ data: events });
    }
  } catch (e) { console.warn('[seed] pulou Event:', e.message); }

  let incident1;
  try {
    incident1 = await prisma.incident.upsert({
      where: { id: 'demo-incident-001' },
      update: {},
      create: {
        id: 'demo-incident-001', clientId: client.id, siteId: site1.id, cameraId: cam1.id,
        title: 'Acesso não autorizado na portaria', description: 'Indivíduo não identificado tentou acessar a portaria fora do horário.',
        severity: 'alta', status: 'em_analise', reportedById: createdUsers.operador?.id, assignedToId: createdUsers.admin?.id,
        snapshotUrl: 'https://demo.local/incident/1.jpg',
      },
    });
  } catch (e) { console.warn('[seed] pulou Incident:', e.message); }

  try {
    await prisma.operator.upsert({
      where: { userId: createdUsers.operador.id },
      update: {},
      create: { userId: createdUsers.operador.id, shift: 'manha', active: true },
    });
  } catch (e) { console.warn('[seed] pulou Operator:', e.message); }

  let tech;
  try {
    tech = await prisma.technician.upsert({
      where: { userId: createdUsers.tecnico.id },
      update: {},
      create: { userId: createdUsers.tecnico.id, phone: '(11) 91234-5678', specialty: 'CFTV', region: 'São Paulo - Zona Sul', active: true },
    });
  } catch (e) { console.warn('[seed] pulou Technician:', e.message); }

  try {
    await prisma.serviceOrder.upsert({
      where: { code: 'OS-2026-0001' },
      update: {},
      create: {
        code: 'OS-2026-0001', clientId: client.id, siteId: site1.id, incidentId: incident1?.id,
        title: 'Verificar câmera com latência alta', description: 'Câmera da garagem apresentando latência acima do normal.',
        priority: 'alta', status: 'atribuida', technicianId: tech?.id, createdById: createdUsers.admin?.id,
        scheduledAt: new Date(Date.now() + 86400000),
      },
    });
  } catch (e) { console.warn('[seed] pulou ServiceOrder:', e.message); }

  try {
    await prisma.inventoryItem.upsert({
      where: { serialNumber: 'INV-CAM-0001' },
      update: {},
      create: {
        serialNumber: 'INV-CAM-0001', type: 'camera', manufacturer: 'Intelbras', model: 'VIP 3230',
        status: 'instalado', ownership: 'comodato', clientId: client.id, siteId: site1.id,
        cameraId: cam1.id, installedAt: new Date(),
      },
    });
  } catch (e) { console.warn('[seed] pulou InventoryItem:', e.message); }

  try {
    await prisma.contract.upsert({
      where: { code: 'CT-2026-001' },
      update: {},
      create: {
        code: 'CT-2026-001', clientId: client.id, siteId: site1.id,
        title: 'Contrato de Monitoramento 24h', description: 'Monitoramento contínuo com suporte técnico.',
        monthlyValue: 1500.00, billingCycle: 'mensal', startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'), status: 'ativo', signedAt: new Date('2025-12-15'),
      },
    });
  } catch (e) { console.warn('[seed] pulou Contract:', e.message); }
}

main().then(()=>prisma.$disconnect()).catch(async(e)=>{console.error('[seed] ERRO:',e.message);await prisma.$disconnect();process.exitCode = 0;});