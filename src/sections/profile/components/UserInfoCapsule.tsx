import { Show } from 'solid-js'

import { useCases } from '~/di/useCases'
import { type User, userSchema } from '~/modules/user/domain/user'
import { Capsule } from '~/sections/common/components/capsule/Capsule'
import { CapsuleContent } from '~/sections/common/components/capsule/CapsuleContent'
import { ComboBox } from '~/sections/common/components/ComboBox'
import {
  DIET_TRANSLATION,
  GENDER_TRANSLATION,
} from '~/sections/profile/components/UserInfo'
import { parseWithStack } from '~/shared/utils/parseWithStack'
import { type Mutable } from '~/shared/utils/typeUtils'

type Translation<T extends string> = { [key in T]: string }

const makeOnChange = <T extends keyof User>(
  field: T,
  convert: (value: string) => User[T] | string,
) => {
  return (
    event: Event & {
      currentTarget: HTMLInputElement
      target: HTMLInputElement
    },
  ) => {
    event.preventDefault()

    const innerData_ = useCases.profileUseCases().innerData()

    if (innerData_ === null) {
      return
    }

    const newUser: Mutable<User> = { ...innerData_ }

    // TODO: Stop storing intermediate values with type assertion lies (maybe store in local var)
    // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1304
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    newUser[field] = convert(event.target.value) as unknown as User[T]
    useCases.profileUseCases().setInnerData(newUser)
  }
}

const makeOnBlur = <T extends keyof User>(
  field: T,
  convert: (value: string) => User[T],
) => {
  return (
    event: FocusEvent & {
      currentTarget: HTMLInputElement
      target: HTMLInputElement
    },
  ) => {
    event.preventDefault()

    const innerData_ = useCases.profileUseCases().innerData()

    if (innerData_ === null) {
      return
    }

    const newUser: Mutable<User> = { ...innerData_ }

    newUser[field] = convert(event.target.value)

    // TODO: Move to server onSave(newProfile)
    useCases.profileUseCases().setInnerData(parseWithStack(userSchema, newUser))
  }
}

export const convertString = (value: string) => value

// User field keys without the brand symbol
type UserFieldKey =
  | 'uuid'
  | 'name'
  | 'favorite_foods'
  | 'diet'
  | 'birthdate'
  | 'gender'
  | 'desired_weight'

/**
 * Safely converts a user field value to string for display
 */
function valueToString(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  return JSON.stringify(value)
}

// TODO: Create module for translations
const USER_FIELD_TRANSLATION: Translation<UserFieldKey> = {
  name: 'Nome',
  gender: 'Gênero',
  diet: 'Dieta',
  birthdate: 'Data de Nascimento',
  favorite_foods: 'Alimentos Favoritos',
  uuid: 'ID',
  desired_weight: 'Peso Alvo',
}

function renderComboBox<T extends keyof User>(
  field: T,
  translation: Translation<string>,
  innerData: () => User,
  setInnerData: (user: User) => void,
) {
  const options = Object.entries(translation).map(([key, label]) => ({
    value: key,
    label,
  }))
  return (
    <ComboBox
      options={options}
      value={valueToString(innerData()[field])}
      onChange={(value) => {
        const newUser = {
          ...innerData(),
          [field]: value,
        }
        setInnerData(parseWithStack(userSchema, newUser))
      }}
      class="w-full text-xl text-center bg-slate-900"
    />
  )
}

export function UserInfoCapsule<T extends UserFieldKey>(props: {
  field: T
  convert: (value: string) => User[T]
  extra?: string
}) {
  return (
    <Capsule
      leftContent={<LeftContent {...props} />}
      rightContent={<RightContent {...props} />}
      class="mb-2"
    />
  )
}

function LeftContent(props: { field: UserFieldKey; extra?: string }) {
  return (
    <CapsuleContent>
      <h5
        class={`text-xl ${
          useCases.profileUseCases().unsavedFields()[props.field] === true
            ? 'text-red-500 italic'
            : ''
        }`}
      >
        {USER_FIELD_TRANSLATION[props.field]} {props.extra}{' '}
        {useCases.profileUseCases().unsavedFields()[props.field] === true
          ? '*'
          : ''}
      </h5>
    </CapsuleContent>
  )
}

function RightContent<T extends keyof Omit<User, '__type'>>(props: {
  field: T
  convert: (value: string) => User[T]
}) {
  // Render ComboBox for diet and gender, input for others
  return (
    <CapsuleContent>
      <div class="flex items-center justify-center w-full">
        <Show when={useCases.profileUseCases().innerData()}>
          {(innerData) => {
            if (props.field === 'diet' || props.field === 'gender') {
              const translation =
                props.field === 'diet' ? DIET_TRANSLATION : GENDER_TRANSLATION
              return renderComboBox(
                props.field,
                translation,
                innerData,
                useCases.profileUseCases().setInnerData,
              )
            }
            return (
              <input
                class={
                  'btn-ghost input bg-transparent text-center px-0 text-xl my-auto'
                }
                value={valueToString(innerData()[props.field])}
                // TODO: Stop storing intermediate values with type assertion lies (maybe store in local var)
                // Issue URL: https://github.com/marcuscastelo/macroflows/issues/1303
                onChange={makeOnChange(props.field, convertString)}
                onBlur={makeOnBlur(props.field, props.convert)}
                style={{ width: '100%' }}
              />
            )
          }}
        </Show>
      </div>
    </CapsuleContent>
  )
}
