import { z } from 'zod/v4'

export const apiFoodSchema = z.object({
  id: z.number(),
  nome: z.string(),
  tipo: z.string(),
  favorito: z.boolean(),
  ean: z.string(),
  idCliente: z.number(),
  calorias: z.number(),
  proteinas: z.number(),
  carboidratos: z.number(),
  gordura: z.number(),
  gorduraTrans: z.number(),
  gorduraSaturada: z.number(),
  fibra: z.number(),
  acucar: z.number(),
  sodio: z.number(),
  calcio: z.number(),
  ferro: z.number(),
  pesoTotalReceita: z.number(),
  pesoAposPreparo: z.number(),
  aprovado: z.boolean(),
  padrao: z.boolean(),
  possuiFotoTabelaNutricional: z.boolean(),
  fotoTabelaNutricional: z.string(),
  multiplicador: z.number(),
  preco: z.object({
    precoMedio: z.object({
      preco: z.number(),
      quantidade: z.number(),
    }),
    precoUsuario: z.object({
      preco: z.number(),
      gramas: z.number(),
      precoGrama: z.number(),
    }),
    precoListagem: z.object({
      preco: z.number(),
      tipo: z.string(),
    }),
  }),
  porcaoPersonalizada: z.object({
    nome: z.string(),
    multiplicador: z.number(),
  }),
  porcoes: z.array(
    z.object({
      id: z.number(),
      nome: z.string(),
      unidade: z.string(),
      multiplicador: z.number(),
      padrao: z.boolean(),
    }),
  ),
  alimentos: z.array(z.any()),
})

export type ApiFood = Readonly<z.infer<typeof apiFoodSchema>>
