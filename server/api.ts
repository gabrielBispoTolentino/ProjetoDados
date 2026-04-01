import type {
  ApiId,
  ApiMessageResponse,
  AppointmentCreateResponse,
  AvailablePlan,
  CreateAgendamentoPayload,
  CreatePlanPayload,
  CreateUserPayload,
  Establishment,
  GenerateReportLucroPayload,
  LoginCredentials,
  LoginResponse,
  MarketplacePlan,
  PaymentMethodId,
  PlanBenefit,
  PlanBenefitPayload,
  PlanPartner,
  ReportLucroEntry,
  ReviewPayload,
  Service,
  SubscribeToPlanPayload,
  SubscribeToPlanResponse,
  TimeSlotsResponse,
  UpdatePlanPayload,
  UpdateUserPayload,
  UserAppointment,
  UserSubscription,
  UserSummary,
} from '../src/types/domain';

type DemoUser = UserSummary & { senha: string; cpf: string; telefone: string };
type DemoEst = Establishment & {
  nome: string;
  name: string;
  address: string;
  cidade: string;
  stado: string;
  rua: string;
  cep: string;
  pais?: string | null;
  phone?: string | null;
  mei?: string | null;
  description?: string | null;
  imagem_url?: string | null;
  imageUrl?: string | null;
  rating_avg: number;
  rating_count: number;
  dono_id: number;
};
type DemoPlan = AvailablePlan & { criador_estabelecimento_id: number };
type DemoPartnership = { id: number; plano_id: number; estabelecimento_id: number; status: string; data_entrada: string };
type DemoSub = UserSubscription & {
  usuario_id: number;
  pagamento_metodo_id: PaymentMethodId;
  preco_periodo_atual: number;
  proxima_data_cobranca: string | null;
  motivo_cancelamento?: string | null;
};
type DemoAppointment = UserAppointment & {
  usuario_id: number;
  estabelecimento_id: number;
  servico_id: number;
  metodo_pagamento: PaymentMethodId;
};
type DemoBenefit = PlanBenefit & { plano_id: number };
type DemoReport = ReportLucroEntry & { estabelecimento_id: number };
type DemoReview = ReviewPayload & { id: number; created_at: string };
type DemoDb = {
  version: number;
  users: DemoUser[];
  establishments: DemoEst[];
  services: Service[];
  plans: DemoPlan[];
  partnerships: DemoPartnership[];
  subscriptions: DemoSub[];
  appointments: DemoAppointment[];
  planBenefits: DemoBenefit[];
  reports: DemoReport[];
  reviews: DemoReview[];
  nextIds: {
    user: number;
    establishment: number;
    plan: number;
    partnership: number;
    subscription: number;
    appointment: number;
    benefit: number;
    review: number;
    report: number;
  };
};

const DB_VERSION = 1;
const STORAGE_KEY = 'prefeito-demo-db-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
let memoryDb: DemoDb | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function svgData(title: string, accent: string, secondary = '#111827'): string {
  const safe = title.replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="${accent}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><circle cx="96" cy="72" r="84" fill="rgba(255,255,255,0.08)"/><circle cx="552" cy="336" r="120" fill="rgba(255,255,255,0.06)"/><text x="52" y="222" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="700">${safe}</text><text x="52" y="270" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial, sans-serif" font-size="20">Demo Preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function avatar(name: string, accent: string): string {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  return svgData(initials || 'DC', accent, '#0f172a');
}

function isoAt(days: number, time: string): string {
  const [hour, minute] = time.split(':').map((v) => Number.parseInt(v, 10));
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function dayAt(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function cycleDate(cycle: string, base = new Date()): string {
  const date = new Date(base);
  if (cycle === 'anual') {
    date.setFullYear(date.getFullYear() + 1);
  } else if (cycle === 'quartenamente') {
    date.setMonth(date.getMonth() + 3);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

function roleOf(role: string | null | undefined): string {
  return role === 'ADM_Estabelecimento' ? 'ADM_Estabelecimento' : 'Cliente';
}

function toNumber(value: ApiId | string | number | null | undefined): number {
  return typeof value === 'number' ? value : Number.parseInt(String(value ?? '0'), 10);
}

function storage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function seedDb(): DemoDb {
  const users: DemoUser[] = [
    { id: 1, nome: 'Ana Designer', email: 'cliente@demo.com', senha: '123456', cpf: '11111111111', telefone: '(11) 99999-1111', role: 'Cliente', fotoUrl: avatar('Ana Designer', '#ef4444'), foto_url: avatar('Ana Designer', '#ef4444') },
    { id: 2, nome: 'Bruno Admin', email: 'admin@demo.com', senha: '123456', cpf: '22222222222', telefone: '(11) 98888-2222', role: 'ADM_Estabelecimento', fotoUrl: avatar('Bruno Admin', '#0ea5e9'), foto_url: avatar('Bruno Admin', '#0ea5e9') },
    { id: 3, nome: 'Cecilia Parceira', email: 'cecilia@demo.com', senha: '123456', cpf: '33333333333', telefone: '(21) 97777-3333', role: 'ADM_Estabelecimento', fotoUrl: avatar('Cecilia Parceira', '#8b5cf6'), foto_url: avatar('Cecilia Parceira', '#8b5cf6') },
    { id: 4, nome: 'Diego Navalha', email: 'diego@demo.com', senha: '123456', cpf: '44444444444', telefone: '(31) 96666-4444', role: 'ADM_Estabelecimento', fotoUrl: avatar('Diego Navalha', '#f59e0b'), foto_url: avatar('Diego Navalha', '#f59e0b') },
    { id: 5, nome: 'Elisa Central', email: 'elisa@demo.com', senha: '123456', cpf: '55555555555', telefone: '(41) 95555-5555', role: 'ADM_Estabelecimento', fotoUrl: avatar('Elisa Central', '#22c55e'), foto_url: avatar('Elisa Central', '#22c55e') },
    { id: 6, nome: 'Fabio Cliente', email: 'fabio@demo.com', senha: '123456', cpf: '66666666666', telefone: '(51) 94444-6666', role: 'Cliente', fotoUrl: avatar('Fabio Cliente', '#ec4899'), foto_url: avatar('Fabio Cliente', '#ec4899') },
  ];
  const establishments: DemoEst[] = [
    { id: 101, nome: 'Dinamic Cut Centro', name: 'Dinamic Cut Centro', address: 'Rua das Palmeiras, 320 - Centro', rua: 'Rua das Palmeiras, 320', cidade: 'Sao Paulo', stado: 'SP', pais: 'Brasil', cep: '01010-000', description: 'Unidade principal com lounge, servico premium e assinatura recorrente.', phone: '(11) 4002-1010', mei: '12.345.678/0001-90', dono_id: 2, imagem_url: svgData('Dinamic Cut Centro', '#1d4ed8'), imageUrl: svgData('Dinamic Cut Centro', '#1d4ed8'), rating_avg: 4.8, rating_count: 124, rating: 4.8, ratingCount: 124 },
    { id: 102, nome: 'Dinamic Cut Jardins', name: 'Dinamic Cut Jardins', address: 'Alameda Oscar Freire, 880 - Jardins', rua: 'Alameda Oscar Freire, 880', cidade: 'Sao Paulo', stado: 'SP', pais: 'Brasil', cep: '01426-001', description: 'Espaco focado em cortes executivos e atendimento rapido.', phone: '(11) 4002-2020', mei: '98.765.432/0001-10', dono_id: 2, imagem_url: svgData('Dinamic Cut Jardins', '#0f766e'), imageUrl: svgData('Dinamic Cut Jardins', '#0f766e'), rating_avg: 4.6, rating_count: 87, rating: 4.6, ratingCount: 87 },
    { id: 103, nome: 'Corte Nobre', name: 'Corte Nobre', address: 'Rua da Republica, 55 - Centro', rua: 'Rua da Republica, 55', cidade: 'Curitiba', stado: 'PR', pais: 'Brasil', cep: '80010-120', description: 'Barbearia boutique com foco em fidelizacao e parcerias B2B.', phone: '(41) 3333-1030', mei: '22.222.222/0001-22', dono_id: 3, imagem_url: svgData('Corte Nobre', '#7c3aed'), imageUrl: svgData('Corte Nobre', '#7c3aed'), rating_avg: 4.9, rating_count: 201, rating: 4.9, ratingCount: 201 },
    { id: 104, nome: 'Estacao Barba', name: 'Estacao Barba', address: 'Avenida Atlantica, 450 - Boa Viagem', rua: 'Avenida Atlantica, 450', cidade: 'Recife', stado: 'PE', pais: 'Brasil', cep: '51011-000', description: 'Operacao enxuta com forte adesao a planos e servicos de barba.', phone: '(81) 3555-1040', mei: '33.333.333/0001-33', dono_id: 4, imagem_url: svgData('Estacao Barba', '#ea580c'), imageUrl: svgData('Estacao Barba', '#ea580c'), rating_avg: 4.5, rating_count: 63, rating: 4.5, ratingCount: 63 },
    { id: 105, nome: 'Old School Barber', name: 'Old School Barber', address: 'Rua Padre Chagas, 108 - Moinhos', rua: 'Rua Padre Chagas, 108', cidade: 'Porto Alegre', stado: 'RS', pais: 'Brasil', cep: '90570-080', description: 'Visual classico, atendimento premium e alta recorrencia.', phone: '(51) 3666-1050', mei: '44.444.444/0001-44', dono_id: 5, imagem_url: svgData('Old School Barber', '#be123c'), imageUrl: svgData('Old School Barber', '#be123c'), rating_avg: 4.7, rating_count: 98, rating: 4.7, ratingCount: 98 },
    { id: 106, nome: 'Galeria do Corte', name: 'Galeria do Corte', address: 'Rua das Acacias, 77 - Savassi', rua: 'Rua das Acacias, 77', cidade: 'Belo Horizonte', stado: 'MG', pais: 'Brasil', cep: '30140-120', description: 'Casa urbana com servicos expressos e boa rotacao de clientes.', phone: '(31) 3777-1060', mei: '55.555.555/0001-55', dono_id: 4, imagem_url: svgData('Galeria do Corte', '#0284c7'), imageUrl: svgData('Galeria do Corte', '#0284c7'), rating_avg: 4.4, rating_count: 52, rating: 4.4, ratingCount: 52 },
  ];
  const services: Service[] = [{ id: 1, nome: 'Corte de Cabelo', preco_base: 40 }, { id: 2, nome: 'Barba', preco_base: 30 }, { id: 3, nome: 'Combo Completo', preco_base: 60 }];
  const plans: DemoPlan[] = [
    { id: 1001, criador_estabelecimento_id: 101, nome: 'Clube Dinamic Premium', description: 'Descontos progressivos, prioridade no agendamento e beneficios semanais.', preco: 79.9, ciclo_pagamento: 'mensalmente', dias_freetrial: 7, active: true, is_public: true, criado_em: dayAt(-30) },
    { id: 1002, criador_estabelecimento_id: 102, nome: 'Executivo Recorrente', description: 'Plano voltado a cortes recorrentes para publico executivo.', preco: 59.9, ciclo_pagamento: 'mensalmente', dias_freetrial: 0, active: true, is_public: false, criado_em: dayAt(-20) },
    { id: 1003, criador_estabelecimento_id: 103, nome: 'Rede Parceiros Prime', description: 'Plano colaborativo aberto para barbearias parceiras em varias cidades.', preco: 69.9, ciclo_pagamento: 'mensalmente', dias_freetrial: 14, active: true, is_public: true, criado_em: dayAt(-45) },
    { id: 1004, criador_estabelecimento_id: 104, nome: 'Plano Barba Forte', description: 'Recorrencia focada em barba e acabamento.', preco: 49.9, ciclo_pagamento: 'quartenamente', dias_freetrial: 0, active: true, is_public: true, criado_em: dayAt(-12) },
  ];
  const partnerships: DemoPartnership[] = [
    { id: 2001, plano_id: 1001, estabelecimento_id: 104, status: 'ativo', data_entrada: dayAt(-18) },
    { id: 2002, plano_id: 1003, estabelecimento_id: 101, status: 'ativo', data_entrada: dayAt(-11) },
  ];
  const subscriptions: DemoSub[] = [
    { id: 3001, usuario_id: 1, estabelecimento_id: 101, id_estabelecimento: 101, plano_id: 1001, plano_nome: 'Clube Dinamic Premium', status: 'ativo', estabelecimento_nome: 'Dinamic Cut Centro', plano_description: 'Descontos progressivos, prioridade no agendamento e beneficios semanais.', ciclo_pagamento: 'mensalmente', pagamento_metodo_id: 3, preco_periodo_atual: 79.9, data_incio: dayAt(-15), proxima_data_cobranca: cycleDate('mensalmente'), proxima_cobranca: cycleDate('mensalmente') },
    { id: 3002, usuario_id: 6, estabelecimento_id: 103, id_estabelecimento: 103, plano_id: 1003, plano_nome: 'Rede Parceiros Prime', status: 'free trial', estabelecimento_nome: 'Corte Nobre', plano_description: 'Plano colaborativo aberto para barbearias parceiras em varias cidades.', ciclo_pagamento: 'mensalmente', pagamento_metodo_id: 2, preco_periodo_atual: 69.9, data_incio: dayAt(-2), proxima_data_cobranca: dayAt(12), proxima_cobranca: dayAt(12) },
  ];
  const appointments: DemoAppointment[] = [
    { id: 4001, usuario_id: 1, usuario_nome: 'Ana Designer', estabelecimento_id: 101, estabelecimento_nome: 'Dinamic Cut Centro', plano_id: 1001, proximo_pag: isoAt(1, '10:00'), status: 'ativo', pagamento_status: 'pendente', valor: 32, servico_id: 1, metodo_pagamento: 3 },
    { id: 4002, usuario_id: 1, usuario_nome: 'Ana Designer', estabelecimento_id: 101, estabelecimento_nome: 'Dinamic Cut Centro', plano_id: 1001, proximo_pag: isoAt(5, '15:30'), status: 'confirmado', pagamento_status: 'completo', valor: 54, servico_id: 3, metodo_pagamento: 2 },
    { id: 4003, usuario_id: 6, usuario_nome: 'Fabio Cliente', estabelecimento_id: 102, estabelecimento_nome: 'Dinamic Cut Jardins', proximo_pag: isoAt(2, '09:30'), status: 'ativo', pagamento_status: 'pendente', valor: 40, servico_id: 1, metodo_pagamento: 4 },
    { id: 4004, usuario_id: 1, usuario_nome: 'Ana Designer', estabelecimento_id: 103, estabelecimento_nome: 'Corte Nobre', proximo_pag: isoAt(-4, '11:00'), status: 'confirmado', pagamento_status: 'completo', valor: 40, servico_id: 1, metodo_pagamento: 3 },
  ];
  const planBenefits: DemoBenefit[] = [
    { id: 5001, plano_id: 1001, tipo_beneficio: 'desconto_percentual', servico_id: 1, servico_nome: 'Corte de Cabelo', servico_preco: 40, condicao_tipo: 'sempre', condicao_valor: null, desconto_percentual: 20, desconto_fixo: null, ordem: 1 },
    { id: 5002, plano_id: 1001, tipo_beneficio: 'desconto_fixo', servico_id: 2, servico_nome: 'Barba', servico_preco: 30, condicao_tipo: 'dia_semana', condicao_valor: 3, desconto_percentual: null, desconto_fixo: 10, ordem: 2 },
    { id: 5003, plano_id: 1003, tipo_beneficio: 'desconto_percentual', servico_id: null, servico_nome: null, servico_preco: null, condicao_tipo: 'sempre', condicao_valor: null, desconto_percentual: 15, desconto_fixo: null, ordem: 1 },
  ];
  const reports: DemoReport[] = [
    { id: 6001, estabelecimento_id: 101, periodo_comeco: `${new Date().getFullYear()}-01-01`, periodo_final: `${new Date().getFullYear()}-01-31`, lucro_total: 1840, reembolso_total: 120, generado_em: isoAt(-40, '08:00') },
    { id: 6002, estabelecimento_id: 101, periodo_comeco: `${new Date().getFullYear()}-02-01`, periodo_final: `${new Date().getFullYear()}-02-28`, lucro_total: 2160, reembolso_total: 90, generado_em: isoAt(-10, '08:00') },
    { id: 6003, estabelecimento_id: 102, periodo_comeco: `${new Date().getFullYear()}-02-01`, periodo_final: `${new Date().getFullYear()}-02-28`, lucro_total: 1440, reembolso_total: 60, generado_em: isoAt(-9, '09:00') },
  ];
  return {
    version: DB_VERSION,
    users,
    establishments,
    services,
    plans,
    partnerships,
    subscriptions,
    appointments,
    planBenefits,
    reports,
    reviews: [],
    nextIds: { user: 7, establishment: 107, plan: 1005, partnership: 2003, subscription: 3003, appointment: 4005, benefit: 5004, review: 7001, report: 6004 },
  };
}

function persistDb(db: DemoDb): void {
  memoryDb = clone(db);
  storage()?.setItem(STORAGE_KEY, JSON.stringify(db));
}

function loadDb(): DemoDb {
  if (memoryDb) {
    return clone(memoryDb);
  }
  const s = storage();
  const raw = s?.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedDb();
    persistDb(seeded);
    return clone(seeded);
  }
  try {
    const parsed = JSON.parse(raw) as DemoDb;
    if (parsed.version !== DB_VERSION) {
      throw new Error('bad version');
    }
    memoryDb = clone(parsed);
    return clone(parsed);
  } catch {
    const seeded = seedDb();
    persistDb(seeded);
    return clone(seeded);
  }
}

async function mutateDb<T>(cb: (db: DemoDb) => Promise<T> | T): Promise<T> {
  const db = loadDb();
  const result = await cb(db);
  persistDb(db);
  return result;
}

function userById(db: DemoDb, id: ApiId): DemoUser | undefined {
  return db.users.find((user) => user.id === toNumber(id));
}

function estById(db: DemoDb, id: ApiId): DemoEst | undefined {
  return db.establishments.find((est) => est.id === toNumber(id));
}

function planById(db: DemoDb, id: ApiId): DemoPlan | undefined {
  return db.plans.find((plan) => plan.id === toNumber(id));
}

function serviceById(db: DemoDb, id: ApiId): Service | undefined {
  return db.services.find((service) => service.id === toNumber(id));
}

function ensure<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

function userSummary(user: DemoUser): UserSummary {
  return { id: user.id, nome: user.nome, email: user.email, role: user.role, fotoUrl: user.fotoUrl ?? null, foto_url: user.fotoUrl ?? null };
}

function estPublic(est: DemoEst): Establishment {
  return clone({ ...est, img: est.imagem_url ?? est.imageUrl ?? null, rating: est.rating_avg, rating_avg: est.rating_avg, ratingCount: est.rating_count, rating_count: est.rating_count });
}

function partnerCount(db: DemoDb, planId: number): number {
  return db.partnerships.filter((item) => item.plano_id === planId).length;
}

function decoratedPlan(db: DemoDb, plan: DemoPlan, tipo?: 'criador' | 'parceiro'): AvailablePlan {
  const creator = estById(db, plan.criador_estabelecimento_id);
  return { ...clone(plan), tipo, num_parceiros: partnerCount(db, plan.id), criador_nome: creator?.nome || 'Barbearia', criador_cidade: creator?.cidade || null };
}

function activeShopSub(db: DemoDb, userId: number, establishmentId: number): DemoSub | undefined {
  return db.subscriptions.find((sub) => sub.usuario_id === userId && (sub.estabelecimento_id ?? sub.id_estabelecimento) === establishmentId && ['ativo', 'free trial'].includes(String(sub.status)));
}

function appointmentView(db: DemoDb, item: DemoAppointment): UserAppointment {
  return clone({ ...item, usuario_nome: userById(db, item.usuario_id)?.nome ?? item.usuario_nome, estabelecimento_nome: estById(db, item.estabelecimento_id)?.nome ?? item.estabelecimento_nome });
}

function subscriptionView(db: DemoDb, item: DemoSub): UserSubscription {
  const plan = item.plano_id ? planById(db, item.plano_id) : undefined;
  const establishment = estById(db, item.estabelecimento_id ?? item.id_estabelecimento ?? 0);
  return clone({
    ...item,
    plano_nome: plan?.nome ?? item.plano_nome,
    plano_description: plan?.description ?? item.plano_description,
    estabelecimento_nome: establishment?.nome ?? item.estabelecimento_nome,
    ciclo_pagamento: plan?.ciclo_pagamento ?? item.ciclo_pagamento,
    proxima_cobranca: item.proxima_data_cobranca ?? item.proxima_cobranca,
    preco_periodo_atual: String(item.preco_periodo_atual),
    ['preÃƒÂ§o_periodo_atual']: String(item.preco_periodo_atual),
    ['proxima_data_cobranÃƒÂ§a']: item.proxima_data_cobranca ?? item.proxima_cobranca,
  });
}

function planPartner(db: DemoDb, establishmentId: number, date: string, isCreator: boolean): PlanPartner {
  const establishment = estById(db, establishmentId);
  return { id: establishmentId, estabelecimento_id: establishmentId, status: 'ativo', data_entrada: date, estabelecimento_nome: establishment?.nome ?? 'Barbearia', cidade: establishment?.cidade ?? null, stado: establishment?.stado ?? null, is_criador: isCreator ? 1 : 0 };
}

function recordString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function formFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function fileToDataUrl(file: File | null): Promise<string | null> {
  if (!file) {
    return null;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function createUserRecord(db: DemoDb, data: CreateUserPayload, photoUrl?: string | null): Promise<DemoUser> {
  const exists = db.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase() || user.cpf === data.cpf);
  if (exists) {
    throw new Error('Ja existe um usuario com este email ou CPF');
  }
  const isAdmin = roleOf(data.role) === 'ADM_Estabelecimento';
  const pic = photoUrl || avatar(data.nome, isAdmin ? '#0ea5e9' : '#ef4444');
  const user: DemoUser = { id: db.nextIds.user++, nome: data.nome, email: data.email, senha: data.senha, cpf: data.cpf, telefone: data.telefone, role: roleOf(data.role), fotoUrl: pic, foto_url: pic };
  db.users.push(user);
  return user;
}

function updateEstablishment(target: DemoEst, updates: Record<string, unknown>, imageUrl?: string | null): void {
  target.nome = recordString(updates, 'nome') || target.nome;
  target.name = target.nome;
  target.description = recordString(updates, 'description') || target.description || '';
  target.rua = recordString(updates, 'rua') || target.rua;
  target.cidade = recordString(updates, 'cidade') || target.cidade;
  target.stado = recordString(updates, 'stado') || target.stado;
  target.pais = recordString(updates, 'pais') || target.pais || 'Brasil';
  target.cep = recordString(updates, 'cep') || target.cep;
  target.phone = recordString(updates, 'phone') || target.phone || '';
  target.mei = recordString(updates, 'mei') || target.mei || '';
  target.address = `${target.rua} - ${target.cidade}`;
  if (imageUrl) {
    target.imagem_url = imageUrl;
    target.imageUrl = imageUrl;
  }
}

function applyBenefits(db: DemoDb, subscription: DemoSub | undefined, serviceId: number, originalPrice: number) {
  if (!subscription?.plano_id) {
    return { valor_final: originalPrice, desconto_total: 0, beneficios_aplicados: [], plano_id: undefined };
  }
  const benefits = db.planBenefits.filter((benefit) => benefit.plano_id === subscription.plano_id && benefit.condicao_tipo === 'sempre' && (!benefit.servico_id || benefit.servico_id === serviceId)).sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
  let finalPrice = originalPrice;
  const applied = benefits.map((benefit) => {
    const discount = benefit.desconto_percentual ? finalPrice * (Number(benefit.desconto_percentual) / 100) : Number(benefit.desconto_fixo || 0);
    finalPrice = Math.max(0, finalPrice - discount);
    return { id: benefit.id, tipo: benefit.tipo_beneficio || 'beneficio', condicao: benefit.condicao_tipo || 'sempre', desconto: Number(discount.toFixed(2)), descricao: benefit.servico_nome ? `${benefit.servico_nome}: ${benefit.tipo_beneficio}` : `${benefit.tipo_beneficio || 'Beneficio'} em todos os servicos` };
  });
  return { valor_final: Number(finalPrice.toFixed(2)), desconto_total: Number((originalPrice - finalPrice).toFixed(2)), beneficios_aplicados: applied, plano_id: subscription.plano_id };
}

export const api = {
  async createUserWithPhoto(formData: FormData) {
    return mutateDb(async (db) => {
      const user = await createUserRecord(db, { nome: formString(formData, 'nome'), email: formString(formData, 'email'), senha: formString(formData, 'senha'), cpf: formString(formData, 'cpf'), telefone: formString(formData, 'telefone'), role: formString(formData, 'role') }, await fileToDataUrl(formFile(formData, 'foto')));
      return { mensagem: 'Usuario criado com sucesso', id: user.id, fotoUrl: user.fotoUrl ?? null };
    });
  },

  async createUser(userData: CreateUserPayload) {
    return mutateDb(async (db) => {
      const user = await createUserRecord(db, userData);
      return { mensagem: 'Usuario criado com sucesso', id: user.id, fotoUrl: user.fotoUrl ?? null };
    });
  },

  async getUsers() {
    return loadDb().users.map(userSummary);
  },

  async getUserById(id: ApiId) {
    return userSummary(ensure(userById(loadDb(), id), 'Usuario nao encontrado'));
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const db = loadDb();
    const query = credentials.usuario.trim().toLowerCase();
    const user = db.users.find((item) => (item.email.toLowerCase() === query || item.cpf === credentials.usuario.trim()) && item.senha === credentials.senha);
    if (!user) {
      throw new Error('Usuario ou senha invalidos');
    }
    return { mensagem: 'Login efetuado com sucesso', usuario: userSummary(user) };
  },

  async updateUserWithPhoto(id: ApiId, formData: FormData) {
    return mutateDb(async (db) => {
      const user = ensure(userById(db, id), 'Usuario nao encontrado');
      user.nome = formString(formData, 'nome') || user.nome;
      user.email = formString(formData, 'email') || user.email;
      user.senha = formString(formData, 'senha') || user.senha;
      user.cpf = formString(formData, 'cpf') || user.cpf;
      user.telefone = formString(formData, 'telefone') || user.telefone;
      user.role = roleOf(formString(formData, 'role') || user.role || 'Cliente');
      const photoUrl = await fileToDataUrl(formFile(formData, 'foto'));
      if (photoUrl) {
        user.fotoUrl = photoUrl;
        user.foto_url = photoUrl;
      }
      return { mensagem: 'Usuario atualizado com sucesso', fotoUrl: user.fotoUrl ?? null };
    });
  },

  async updateUser(id: ApiId, userData: UpdateUserPayload) {
    return mutateDb((db) => {
      const user = ensure(userById(db, id), 'Usuario nao encontrado');
      user.nome = userData.nome ?? user.nome;
      user.email = userData.email ?? user.email;
      user.senha = userData.senha ?? user.senha;
      user.cpf = userData.cpf ?? user.cpf;
      user.telefone = userData.telefone ?? user.telefone;
      user.role = roleOf(userData.role ?? user.role ?? 'Cliente');
      return { mensagem: 'Usuario atualizado com sucesso', fotoUrl: user.fotoUrl ?? null };
    });
  },

  async deleteUser(id: ApiId) {
    return mutateDb((db) => {
      const numericId = toNumber(id);
      db.users = db.users.filter((user) => user.id !== numericId);
      db.subscriptions = db.subscriptions.filter((sub) => sub.usuario_id !== numericId);
      db.appointments = db.appointments.filter((appointment) => appointment.usuario_id !== numericId);
      return { mensagem: 'Usuario removido com sucesso' };
    });
  },

  async getEstablishments(page = 1, limit = 5) {
    const db = loadDb();
    const start = Math.max(0, (page - 1) * limit);
    return db.establishments.slice(start, start + limit).map(estPublic);
  },

  async getEstablishmentById(id: ApiId) {
    return estPublic(ensure(estById(loadDb(), id), 'Estabelecimento nao encontrado'));
  },

  async createEstablishmentWithPhoto(formData: FormData) {
    return mutateDb(async (db) => {
      const nome = formString(formData, 'nome') || 'Nova Barbearia';
      const imageUrl = await fileToDataUrl(formFile(formData, 'foto'));
      const est: DemoEst = { id: db.nextIds.establishment++, nome, name: nome, rua: formString(formData, 'rua'), cidade: formString(formData, 'cidade'), stado: formString(formData, 'stado'), pais: formString(formData, 'pais') || 'Brasil', cep: formString(formData, 'cep'), address: `${formString(formData, 'rua')} - ${formString(formData, 'cidade')}`, description: formString(formData, 'description'), phone: formString(formData, 'phone'), mei: formString(formData, 'mei'), dono_id: toNumber(formString(formData, 'dono_id')), imagem_url: imageUrl || svgData(nome, '#334155'), imageUrl: imageUrl || svgData(nome, '#334155'), rating_avg: 4.7, rating_count: 0, rating: 4.7, ratingCount: 0 };
      db.establishments.unshift(est);
      return { mensagem: 'Estabelecimento criado com sucesso', id: est.id, imagem_url: est.imagem_url ?? null };
    });
  },

  async createEstablishment(establishmentData: Record<string, unknown>) {
    return mutateDb((db) => {
      const nome = recordString(establishmentData, 'nome') || 'Nova Barbearia';
      const est: DemoEst = { id: db.nextIds.establishment++, nome, name: nome, rua: recordString(establishmentData, 'rua'), cidade: recordString(establishmentData, 'cidade'), stado: recordString(establishmentData, 'stado'), pais: recordString(establishmentData, 'pais') || 'Brasil', cep: recordString(establishmentData, 'cep'), address: `${recordString(establishmentData, 'rua')} - ${recordString(establishmentData, 'cidade')}`, description: recordString(establishmentData, 'description'), phone: recordString(establishmentData, 'phone'), mei: recordString(establishmentData, 'mei'), dono_id: toNumber(establishmentData.dono_id as ApiId), imagem_url: svgData(nome, '#334155'), imageUrl: svgData(nome, '#334155'), rating_avg: 4.7, rating_count: 0, rating: 4.7, ratingCount: 0 };
      db.establishments.unshift(est);
      return { mensagem: 'Estabelecimento criado com sucesso', id: est.id, imagem_url: est.imagem_url ?? null };
    });
  },

  async updateEstablishmentWithPhoto(id: ApiId, formData: FormData) {
    return mutateDb(async (db) => {
      const est = ensure(estById(db, id), 'Estabelecimento nao encontrado');
      updateEstablishment(est, { nome: formString(formData, 'nome'), description: formString(formData, 'description'), rua: formString(formData, 'rua'), cidade: formString(formData, 'cidade'), stado: formString(formData, 'stado'), pais: formString(formData, 'pais'), cep: formString(formData, 'cep'), phone: formString(formData, 'phone'), mei: formString(formData, 'mei') }, await fileToDataUrl(formFile(formData, 'foto')));
      return { mensagem: 'Estabelecimento atualizado com sucesso', imagem_url: est.imagem_url ?? null };
    });
  },

  async updateEstablishment(id: ApiId, establishmentData: Record<string, unknown>) {
    return mutateDb((db) => {
      const est = ensure(estById(db, id), 'Estabelecimento nao encontrado');
      updateEstablishment(est, establishmentData);
      return { mensagem: 'Estabelecimento atualizado com sucesso', imagem_url: est.imagem_url ?? null };
    });
  },

  async deleteEstablishment(id: ApiId) {
    return mutateDb((db) => {
      const establishmentId = toNumber(id);
      const planIds = db.plans.filter((plan) => plan.criador_estabelecimento_id === establishmentId).map((plan) => plan.id);
      db.establishments = db.establishments.filter((est) => est.id !== establishmentId);
      db.plans = db.plans.filter((plan) => plan.criador_estabelecimento_id !== establishmentId);
      db.partnerships = db.partnerships.filter((item) => item.estabelecimento_id !== establishmentId && !planIds.includes(item.plano_id));
      db.subscriptions = db.subscriptions.filter((sub) => (sub.estabelecimento_id ?? sub.id_estabelecimento) !== establishmentId && !planIds.includes(toNumber(sub.plano_id)));
      db.appointments = db.appointments.filter((appointment) => appointment.estabelecimento_id !== establishmentId);
      db.reports = db.reports.filter((report) => report.estabelecimento_id !== establishmentId);
      return { mensagem: 'Estabelecimento removido com sucesso' };
    });
  },

  async getAgendamentos(usuarioId: ApiId) {
    const db = loadDb();
    return db.appointments.filter((item) => item.usuario_id === toNumber(usuarioId)).map((item) => appointmentView(db, item));
  },

  async createAgendamento(agendamentoData: CreateAgendamentoPayload): Promise<AppointmentCreateResponse> {
    return mutateDb((db) => {
      const user = ensure(userById(db, agendamentoData.usuario_id), 'Usuario nao encontrado');
      const est = ensure(estById(db, agendamentoData.estabelecimento_id), 'Estabelecimento nao encontrado');
      const service = ensure(serviceById(db, agendamentoData.servico_id), 'Servico nao encontrado');
      const clash = db.appointments.some((item) => item.estabelecimento_id === est.id && item.status !== 'cancelado' && item.proximo_pag === agendamentoData.proximo_pag);
      if (clash) {
        throw new Error('Este horario ja esta ocupado');
      }
      const benefits = applyBenefits(db, activeShopSub(db, user.id, est.id), service.id, Number(service.preco_base));
      const appointment: DemoAppointment = { id: db.nextIds.appointment++, usuario_id: user.id, usuario_nome: user.nome, estabelecimento_id: est.id, estabelecimento_nome: est.nome, plano_id: benefits.plano_id, proximo_pag: agendamentoData.proximo_pag, status: 'ativo', pagamento_status: 'pendente', valor: benefits.valor_final, servico_id: service.id, metodo_pagamento: agendamentoData.metodo_pagamento };
      db.appointments.push(appointment);
      return { mensagem: 'Agendamento criado com sucesso', id: appointment.id, servico: service.nome, valor_original: Number(service.preco_base), valor_final: benefits.valor_final, desconto_total: benefits.desconto_total, beneficios_aplicados: benefits.beneficios_aplicados, tem_assinatura: Boolean(benefits.plano_id) };
    });
  },

  async getHorariosDisponiveis(estabelecimentoId: ApiId, data: string): Promise<TimeSlotsResponse> {
    const db = loadDb();
    return { horariosOcupados: db.appointments.filter((item) => item.estabelecimento_id === toNumber(estabelecimentoId) && item.status !== 'cancelado' && item.proximo_pag?.slice(0, 10) === data).map((item) => item.proximo_pag || '').filter(Boolean) };
  },

  async cancelarAgendamento(agendamentoId: ApiId) {
    return mutateDb((db) => {
      ensure(db.appointments.find((item) => item.id === toNumber(agendamentoId)), 'Agendamento nao encontrado').status = 'cancelado';
      return { mensagem: 'Agendamento cancelado com sucesso' };
    });
  },

  async reagendarAgendamento(agendamentoId: ApiId, novaData: string) {
    return mutateDb((db) => {
      const appointment = ensure(db.appointments.find((item) => item.id === toNumber(agendamentoId)), 'Agendamento nao encontrado');
      const clash = db.appointments.some((item) => item.id !== appointment.id && item.estabelecimento_id === appointment.estabelecimento_id && item.status !== 'cancelado' && item.proximo_pag === novaData);
      if (clash) {
        throw new Error('Este novo horario ja esta ocupado');
      }
      appointment.proximo_pag = novaData;
      appointment.status = 'confirmado';
      return { mensagem: 'Agendamento reagendado com sucesso' };
    });
  },

  async pagarAgendamento(agendamentoId: ApiId) {
    return mutateDb((db) => {
      const appointment = ensure(db.appointments.find((item) => item.id === toNumber(agendamentoId)), 'Agendamento nao encontrado');
      appointment.pagamento_status = 'completo';
      if (appointment.status === 'ativo') {
        appointment.status = 'confirmado';
      }
      return { mensagem: 'Pagamento confirmado com sucesso' };
    });
  },

  async getAgendamentosMinhaBarbearia(usuarioId: ApiId) {
    const db = loadDb();
    const owned = db.establishments.filter((est) => est.dono_id === toNumber(usuarioId)).map((est) => est.id);
    return db.appointments.filter((item) => owned.includes(item.estabelecimento_id)).map((item) => appointmentView(db, item));
  },

  async createReview(reviewData: ReviewPayload) {
    return mutateDb((db) => {
      const est = ensure(estById(db, reviewData.estabelecimento_id), 'Estabelecimento nao encontrado');
      db.reviews.push({ id: db.nextIds.review++, ...reviewData, created_at: new Date().toISOString() });
      const total = est.rating_avg * est.rating_count;
      est.rating_count += 1;
      est.rating_avg = Number(((total + reviewData.rating) / est.rating_count).toFixed(1));
      est.rating = est.rating_avg;
      est.ratingCount = est.rating_count;
      return { mensagem: 'Avaliacao registrada com sucesso' };
    });
  },

  async createPlano(planoData: CreatePlanPayload) {
    return mutateDb((db) => {
      ensure(estById(db, planoData.criador_estabelecimento_id), 'Estabelecimento criador nao encontrado');
      const plan: DemoPlan = { id: db.nextIds.plan++, criador_estabelecimento_id: toNumber(planoData.criador_estabelecimento_id), nome: planoData.nome, description: planoData.description || '', preco: planoData.preco, ciclo_pagamento: planoData.ciclo_pagamento, dias_freetrial: planoData.dias_freetrial ?? 0, active: planoData.active ?? true, is_public: planoData.is_public ?? true, criado_em: new Date().toISOString() };
      db.plans.unshift(plan);
      return { mensagem: 'Plano criado com sucesso', id: plan.id };
    });
  },

  async getPlanosByEstabelecimento(estabelecimentoId: ApiId) {
    const db = loadDb();
    return db.plans.filter((plan) => plan.criador_estabelecimento_id === toNumber(estabelecimentoId)).map((plan) => decoratedPlan(db, plan, 'criador'));
  },

  async getPlanosDisponiveisByEstabelecimento(estabelecimentoId: ApiId) {
    const db = loadDb();
    return db.plans.filter((plan) => plan.criador_estabelecimento_id === toNumber(estabelecimentoId) && Boolean(plan.active)).map((plan) => decoratedPlan(db, plan, 'criador'));
  },

  async getMyPlanos(estabelecimentoId: ApiId) {
    const db = loadDb();
    const numericEst = toNumber(estabelecimentoId);
    const created = db.plans.filter((plan) => plan.criador_estabelecimento_id === numericEst).map((plan) => decoratedPlan(db, plan, 'criador'));
    const joinedIds = db.partnerships.filter((item) => item.estabelecimento_id === numericEst).map((item) => item.plano_id);
    const partner = db.plans.filter((plan) => joinedIds.includes(plan.id)).map((plan) => decoratedPlan(db, plan, 'parceiro'));
    return [...created, ...partner];
  },

  async getMarketplacePlanos(estabelecimentoId: ApiId): Promise<MarketplacePlan[]> {
    const db = loadDb();
    const numericEst = toNumber(estabelecimentoId);
    const joinedIds = new Set(db.partnerships.filter((item) => item.estabelecimento_id === numericEst).map((item) => item.plano_id));
    return db.plans.filter((plan) => Boolean(plan.active) && Boolean(plan.is_public) && plan.criador_estabelecimento_id !== numericEst && !joinedIds.has(plan.id)).map((plan) => decoratedPlan(db, plan) as MarketplacePlan);
  },

  async participarPlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return mutateDb((db) => {
      const plan = ensure(planById(db, planoId), 'Plano nao encontrado');
      const numericEst = toNumber(estabelecimentoId);
      if (!plan.is_public) {
        throw new Error('Este plano nao aceita parceiros');
      }
      if (plan.criador_estabelecimento_id === numericEst) {
        throw new Error('A barbearia criadora nao pode participar como parceira');
      }
      const exists = db.partnerships.some((item) => item.plano_id === plan.id && item.estabelecimento_id === numericEst);
      if (exists) {
        throw new Error('Esta barbearia ja participa deste plano');
      }
      db.partnerships.push({ id: db.nextIds.partnership++, plano_id: plan.id, estabelecimento_id: numericEst, status: 'ativo', data_entrada: new Date().toISOString() });
      return { mensagem: 'Parceria criada com sucesso' };
    });
  },

  async sairPlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return mutateDb((db) => {
      const before = db.partnerships.length;
      db.partnerships = db.partnerships.filter((item) => !(item.plano_id === toNumber(planoId) && item.estabelecimento_id === toNumber(estabelecimentoId)));
      if (before === db.partnerships.length) {
        throw new Error('Parceria nao encontrada');
      }
      return { mensagem: 'Parceria removida com sucesso' };
    });
  },

  async getPlanoParceiros(planoId: ApiId) {
    const db = loadDb();
    const plan = ensure(planById(db, planoId), 'Plano nao encontrado');
    return [planPartner(db, plan.criador_estabelecimento_id, plan.criado_em || new Date().toISOString(), true), ...db.partnerships.filter((item) => item.plano_id === plan.id).map((item) => planPartner(db, item.estabelecimento_id, item.data_entrada, false))];
  },

  async getPlanosDisponiveis() {
    const db = loadDb();
    return db.plans.filter((plan) => Boolean(plan.active)).map((plan) => decoratedPlan(db, plan, 'criador'));
  },

  async updatePlano(planoId: ApiId, planoData: UpdatePlanPayload) {
    return mutateDb((db) => {
      const plan = ensure(planById(db, planoId), 'Plano nao encontrado');
      plan.nome = planoData.nome ?? plan.nome;
      plan.description = planoData.description ?? plan.description;
      plan.preco = planoData.preco ?? plan.preco;
      plan.ciclo_pagamento = planoData.ciclo_pagamento ?? plan.ciclo_pagamento;
      plan.dias_freetrial = planoData.dias_freetrial ?? plan.dias_freetrial;
      plan.active = planoData.active ?? plan.active;
      plan.is_public = planoData.is_public ?? plan.is_public;
      return { mensagem: 'Plano atualizado com sucesso' };
    });
  },

  async deletePlano(planoId: ApiId, estabelecimentoId: ApiId) {
    return mutateDb((db) => {
      const plan = ensure(planById(db, planoId), 'Plano nao encontrado');
      if (plan.criador_estabelecimento_id !== toNumber(estabelecimentoId)) {
        throw new Error('Apenas o criador pode deletar este plano');
      }
      db.plans = db.plans.filter((item) => item.id !== plan.id);
      db.partnerships = db.partnerships.filter((item) => item.plano_id !== plan.id);
      db.planBenefits = db.planBenefits.filter((item) => item.plano_id !== plan.id);
      db.subscriptions = db.subscriptions.filter((item) => item.plano_id !== plan.id);
      return { mensagem: 'Plano deletado com sucesso' };
    });
  },

  async subscribeToPlan(inscricaoData: SubscribeToPlanPayload): Promise<SubscribeToPlanResponse> {
    return mutateDb((db) => {
      const user = ensure(userById(db, inscricaoData.usuario_id), 'Usuario nao encontrado');
      const plan = ensure(planById(db, inscricaoData.plano_id), 'Plano nao encontrado');
      const est = ensure(estById(db, plan.criador_estabelecimento_id), 'Estabelecimento nao encontrado');
      const exists = db.subscriptions.some((item) => item.usuario_id === user.id && item.plano_id === plan.id && ['ativo', 'free trial', 'pendente'].includes(String(item.status)));
      if (exists) {
        throw new Error('Voce ja possui uma assinatura ativa ou pendente para este plano');
      }
      const nextBilling = plan.dias_freetrial > 0 ? new Date(Date.now() + plan.dias_freetrial * DAY_MS).toISOString() : new Date(Date.now() + 7 * DAY_MS).toISOString();
      db.subscriptions.push({ id: db.nextIds.subscription++, usuario_id: user.id, estabelecimento_id: est.id, id_estabelecimento: est.id, plano_id: plan.id, plano_nome: plan.nome, plano_description: plan.description ?? '', estabelecimento_nome: est.nome, ciclo_pagamento: plan.ciclo_pagamento, pagamento_metodo_id: inscricaoData.pagamento_metodo_id, preco_periodo_atual: Number(plan.preco), data_incio: new Date().toISOString(), proxima_data_cobranca: nextBilling, proxima_cobranca: nextBilling, status: plan.dias_freetrial > 0 ? 'free trial' : 'pendente' });
      return { mensagem: 'Assinatura criada com sucesso', proxima_cobranca: nextBilling };
    });
  },

  async getUserSubscriptions(usuarioId: ApiId) {
    const db = loadDb();
    return db.subscriptions.filter((item) => item.usuario_id === toNumber(usuarioId)).map((item) => subscriptionView(db, item));
  },

  async cancelSubscription(inscricaoId: ApiId, motivo: string | null) {
    return mutateDb((db) => {
      const sub = ensure(db.subscriptions.find((item) => item.id === toNumber(inscricaoId)), 'Assinatura nao encontrada');
      sub.status = 'cancelado';
      sub.motivo_cancelamento = motivo;
      return { mensagem: 'Assinatura cancelada com sucesso' };
    });
  },

  async getPlanoBeneficios(planoId: ApiId) {
    const db = loadDb();
    return db.planBenefits.filter((item) => item.plano_id === toNumber(planoId)).map((item) => ({ ...clone(item), servico_nome: item.servico_id ? serviceById(db, item.servico_id)?.nome ?? item.servico_nome ?? null : null, servico_preco: item.servico_id ? serviceById(db, item.servico_id)?.preco_base ?? item.servico_preco ?? null : null }));
  },

  async addPlanoBeneficio(planoId: ApiId, beneficioData: PlanBenefitPayload) {
    return mutateDb((db) => {
      const servicoId = beneficioData.servico_id ? toNumber(beneficioData.servico_id) : null;
      const servico = servicoId ? serviceById(db, servicoId) : undefined;
      const benefit: DemoBenefit = { id: db.nextIds.benefit++, plano_id: toNumber(planoId), tipo_beneficio: beneficioData.tipo_beneficio, servico_id: servicoId, servico_nome: servico?.nome ?? null, servico_preco: servico?.preco_base ?? null, condicao_tipo: beneficioData.condicao_tipo, condicao_valor: beneficioData.condicao_valor ? Number(beneficioData.condicao_valor) : null, desconto_percentual: beneficioData.desconto_percentual ? Number(beneficioData.desconto_percentual) : null, desconto_fixo: beneficioData.desconto_fixo ? Number(beneficioData.desconto_fixo) : null, ordem: beneficioData.ordem ? Number(beneficioData.ordem) : 0 };
      db.planBenefits.push(benefit);
      return { mensagem: 'Beneficio adicionado com sucesso', id: benefit.id };
    });
  },

  async getServicos() {
    return clone(loadDb().services);
  },

  async getReportLucro(estabelecimentoId: ApiId) {
    return loadDb().reports.filter((item) => item.estabelecimento_id === toNumber(estabelecimentoId)).map((item) => clone(item));
  },

  async generateReportLucro(payload: GenerateReportLucroPayload): Promise<ApiMessageResponse> {
    return mutateDb((db) => {
      const start = new Date(payload.periodo_comeco);
      const end = new Date(payload.periodo_final);
      end.setHours(23, 59, 59, 999);
      const related = db.appointments.filter((item) => item.estabelecimento_id === payload.estabelecimento_id && item.proximo_pag && new Date(item.proximo_pag) >= start && new Date(item.proximo_pag) <= end);
      const lucro = related.filter((item) => item.status !== 'cancelado').reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const reembolso = related.filter((item) => item.status === 'cancelado' && item.pagamento_status === 'completo').reduce((sum, item) => sum + Number(item.valor || 0), 0);
      db.reports.unshift({ id: db.nextIds.report++, estabelecimento_id: payload.estabelecimento_id, periodo_comeco: payload.periodo_comeco, periodo_final: payload.periodo_final, lucro_total: Number(lucro.toFixed(2)), reembolso_total: Number(reembolso.toFixed(2)), generado_em: new Date().toISOString() });
      return { mensagem: 'Relatorio gerado com sucesso' };
    });
  },

  getPhotoUrl(photoPath: string | null | undefined) {
    if (!photoPath) {
      return null;
    }
    return photoPath;
  },
};
