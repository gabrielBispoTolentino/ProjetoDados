export type EntityId = number;
export type NumericValue = number | string;
export type ApiId = EntityId | string;

export type PaymentMethodId = 1 | 2 | 3 | 4;
export type PaymentMethodValue = '1' | '2' | '3' | '4';
export type ServiceOptionId = '1' | '2' | '3';

export type AppointmentStatus =
  | 'ativo'
  | 'atrasado'
  | 'cancelado'
  | 'completo'
  | 'free trial'
  | 'pausado'
  | 'pendente'
  | 'confirmado';

export type SubscriptionStatus =
  | 'ativo'
  | 'free trial'
  | 'pendente'
  | 'cancelado'
  | 'atrasado'
  | 'pausado';

export interface ApiMessageResponse {
  mensagem: string;
  [key: string]: unknown;
}

export interface UserSummary {
  id: EntityId;
  nome: string;
  email: string;
  role?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string | null;
  fotoUrl?: string | null;
  foto_url?: string | null;
  imagem_url?: string | null;
  idbarberworker?: EntityId | null;
  verifycode?: string | null;
  verified?: boolean;
  userTable?: string | null;
  barbershopPlanId?: EntityId | null;
  barbershopPlanCode?: string | null;
  barbershopPlanName?: string | null;
  barbershopPlanPrice?: NumericValue | null;
  barbershopPlanBillingCycle?: string | null;
}

export interface LoginCredentials {
  usuario: string;
  senha: string;
}

export interface PartnerLoginCredentials {
  email: string;
  senha: string;
  verifycode: string;
}

export interface LoginResponse {
  mensagem: string;
  usuario: UserSummary;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
  role: string;
  barbershop_plan_id?: number | string;
}

export interface BarbershopPlanType {
  id: EntityId;
  code: string;
  name: string;
  description?: string | null;
  price: NumericValue;
  billingCycle: string;
  maxBarbers?: number | null;
  maxEstablishments?: number | null;
}
export interface AdmFields{
  cnpj: string;
}
export interface UserFields{
  cpf: string;
}
export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export interface CreateBarberPayload {
  admin_user_id: EntityId;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
}

export interface BarberSummary extends UserSummary {}

export interface BookingBarberOption {
  id: EntityId;
  nome: string;
  fotoUrl?: string | null;
  imagem_url?: string | null;
}

export interface Establishment {
  id: EntityId;
  name: string;
  address?: string | null;
  description?: string | null;
  phone?: string | null;
  mei?: NumericValue | null;
  latitude?: NumericValue | null;
  longitude?: NumericValue | null;
  googleMapsUrl?: string | null;
  locationVerified?: boolean | number | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  imagePaths?: string[] | null;
  rating?: NumericValue | null;
  ratingCount?: NumericValue | null;
  dono_id?: EntityId;
  barbercode?: string | null;
  fullAddress?: {
    rua: string;
    cidade: string;
    estado: string;
    pais?: string;
    cep: string;
  };
}

export interface ShopSummary {
  id: EntityId;
  name: string;
  address?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  imagePaths?: string[] | null;
  rating?: NumericValue | null;
  ratingCount?: NumericValue | null;
  latitude?: NumericValue | null;
  longitude?: NumericValue | null;
  googleMapsUrl?: string | null;
  googleMapsEmbedUrl?: string | null;
  locationVerified?: boolean | number | null;
  fullAddress?: {
    rua: string;
    cidade: string;
    estado: string;
    pais?: string;
    cep: string;
  };
}

export interface BookingFormData {
  estabelecimento_id: string;
  barbeiro_id: string;
  servico_id: ServiceOptionId;
  selectedDate: string;
  proximo_pag: string;
  status: AppointmentStatus;
  metodo_pagamento: PaymentMethodValue;
}

export interface CreateAgendamentoPayload {
  usuario_id: EntityId;
  estabelecimento_id: EntityId;
  barbeiro_id: EntityId;
  servico_id: number;
  proximo_pag: string;
  metodo_pagamento: PaymentMethodId;
}

export interface AppliedBenefit {
  id: EntityId;
  tipo: string;
  condicao: string;
  desconto: number;
  descricao: string;
}

export interface AppointmentCreateResponse extends ApiMessageResponse {
  id: EntityId | null;
  servico?: string;
  valor_original?: number;
  valor_final?: number;
  desconto_total?: number;
  beneficios_aplicados?: AppliedBenefit[];
  tem_assinatura?: boolean;
}

export interface UserAppointment {
  id: EntityId;
  usuario_id?: EntityId;
  estabelecimento_id?: EntityId;
  plano_id?: EntityId;
  proximo_pag?: string;
  status?: string;
  usuario_nome?: string;
  estabelecimento_nome?: string;
  pagamento_status?: string;
  valor?: NumericValue | null;
}

export interface TimeSlotsResponse {
  horariosOcupados: string[];
}

export interface ReviewPayload {
  usuario_id: EntityId;
  estabelecimento_id: EntityId;
  rating: number;
  comentario: string;
}

export interface ReviewSummary {
  id: EntityId;
  rating: number;
  comentario: string;
  usuarioNome: string;
  usuarioFotoUrl?: string | null;
}

export interface ReviewsResponse {
  reviews: ReviewSummary[];
  ratingAvg: number;
  ratingCount: number;
}

export interface PlanBase {
  id: EntityId;
  nome: string;
  description?: string | null;
  preco: NumericValue;
  ciclo_pagamento: string;
  dias_freetrial: number;
  active?: boolean | number;
  is_public?: boolean | number;
  criador_estabelecimento_id?: EntityId;
  criador_nome?: string;
  criador_cidade?: string | null;
  num_parceiros?: number;
  tipo?: 'criador' | 'parceiro';
  criado_em?: string;
}

export interface MarketplacePlan extends PlanBase {
  criador_nome: string;
  num_parceiros: number;
}

export interface AvailablePlan extends PlanBase {}

export interface CreatePlanPayload {
  criador_estabelecimento_id: EntityId;
  nome: string;
  description?: string | null;
  preco: number;
  ciclo_pagamento: string;
  dias_freetrial?: number;
  is_public?: boolean;
  active?: boolean;
  estabelecimento_id?: EntityId;
}

export interface UpdatePlanPayload extends Partial<CreatePlanPayload> {
  estabelecimento_id?: EntityId;
}

export interface PlanPartner {
  id: EntityId;
  estabelecimento_id: EntityId;
  status: string;
  data_entrada: string;
  estabelecimento_nome: string;
  cidade?: string | null;
  stado?: string | null;
  is_criador: number | boolean;
}

export interface UserSubscription {
  id: EntityId;
  status: SubscriptionStatus | string;
  estabelecimento_id?: EntityId | null;
  id_estabelecimento?: EntityId | null;
  plano_id?: EntityId;
  plano_nome?: string;
  plano_description?: string | null;
  estabelecimento_nome?: string;
  ciclo_pagamento?: string;
  proxima_cobranca?: string;
  data_incio?: string;
  [key: string]: unknown;
}

export interface SubscribeToPlanPayload {
  usuario_id: EntityId;
  plano_id: EntityId;
  pagamento_metodo_id: PaymentMethodId;
}

export interface SubscribeToPlanResponse extends ApiMessageResponse {
  proxima_cobranca?: string;
}

export interface PlanBenefit {
  id: EntityId;
  plano_id?: EntityId;
  tipo_beneficio?: string;
  servico_id?: EntityId | null;
  servico_nome?: string | null;
  servico_preco?: NumericValue | null;
  condicao_tipo?: string;
  condicao_valor?: NumericValue | null;
  desconto_percentual?: NumericValue | null;
  desconto_fixo?: NumericValue | null;
  ordem?: number;
}

export interface PlanBenefitPayload {
  tipo_beneficio: string;
  servico_id?: string | number;
  condicao_tipo: string;
  condicao_valor?: string | number;
  desconto_percentual?: string | number;
  desconto_fixo?: string | number;
  ordem?: string | number;
}

export interface Service {
  id: EntityId;
  nome: string;
  preco_base: NumericValue;
  [key: string]: unknown;
}

export interface ReportLucroEntry {
  id: EntityId;
  periodo_comeco: string;
  periodo_final: string;
  lucro_total: NumericValue;
  reembolso_total: NumericValue;
  generado_em: string;
}

export interface GenerateReportLucroPayload {
  estabelecimento_id: EntityId;
  periodo_comeco: string;
  periodo_final: string;
}
export interface PagamentoAdmin {
  id: EntityId;
  estabelecimento_id: EntityId;
  valor: NumericValue;
  data_pagamento: string;
}

export interface BarberSignupPayload {
  barbercode: string;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
}

export interface ValidateBarbercodeResponse {
  valid: boolean;
  establishment: {
    id: number;
    nome: string;
  };
}

export interface BarberInvitePayload {
  admin_user_id: EntityId;
  establishment_id: EntityId;
  email: string;
}
