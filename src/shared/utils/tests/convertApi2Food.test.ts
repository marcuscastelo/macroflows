import { describe, expect, it } from 'vitest'

import { apiFoodSchema } from '~/modules/diet/food/infrastructure/api/domain/apiFoodSchema'
import { convertApi2Food } from '~/shared/utils/convertApi2Food'
import { parseWithStack } from '~/shared/utils/parseWithStack'

const baseApiFood = {
  id: 1,
  nome: 'Test Food',
  tipo: 'x',
  favorito: false,
  ean: '',
  idCliente: 0,
  calorias: 0,
  proteinas: 5,
  carboidratos: 10,
  gordura: 2,
  gorduraTrans: 0,
  gorduraSaturada: 0,
  fibra: 0,
  acucar: 0,
  sodio: 0,
  calcio: 0,
  ferro: 0,
  pesoTotalReceita: 0,
  pesoAposPreparo: 0,
  aprovado: false,
  padrao: false,
  possuiFotoTabelaNutricional: false,
  fotoTabelaNutricional: '',
  multiplicador: 1,
  preco: {
    precoMedio: { preco: 0, quantidade: 0 },
    precoUsuario: { preco: 0, gramas: 0, precoGrama: 0 },
    precoListagem: { preco: 0, tipo: '' },
  },
  porcaoPersonalizada: { nome: '', multiplicador: 1 },
  porcoes: [],
  alimentos: [],
}

describe('convertApi2Food', () => {
  it('converts API food to NewFood with expected fields', () => {
    const apiFood = parseWithStack(apiFoodSchema, baseApiFood)

    const newFood = convertApi2Food(apiFood)

    expect(newFood.name).toBe(baseApiFood.nome)
    expect(newFood.ean).toBeNull()
    expect(newFood.source?.id).toBe(String(baseApiFood.id))

    // convertApi2Food multiplies incoming macros by 100000 per implementation
    expect(newFood.macros.carbsInMg).toBe(baseApiFood.carboidratos * 100000)
    expect(newFood.macros.proteinInMg).toBe(baseApiFood.proteinas * 100000)
    expect(newFood.macros.fatInMg).toBe(baseApiFood.gordura * 100000)
  })
})
