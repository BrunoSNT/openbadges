import { ReactEcsRenderer, UiEntity, Input, Label, Button, ReactEcs } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

// Global state to control visibility and value
export let showAchievementNameInput = false
export let achievementNameInputValue = ''
export let achievementNameInputCallback: undefined | ((value: string) => void) = undefined

export function showAchievementNameInputUI(onSubmit: (value: string) => void) {
  console.log('🔧 showAchievementNameInputUI called')
  showAchievementNameInput = true
  achievementNameInputValue = ''
  achievementNameInputCallback = onSubmit
  console.log('🔧 showAchievementNameInput set to:', showAchievementNameInput)
}

export function hideAchievementNameInputUI() {
  console.log('🔧 hideAchievementNameInputUI called')
  showAchievementNameInput = false
  achievementNameInputValue = ''
  achievementNameInputCallback = undefined
  console.log('🔧 showAchievementNameInput set to:', showAchievementNameInput)
}

function handleSubmitText(value: string) {
  console.log('🔧 handleSubmitText called with:', value)
  if (value.trim() && achievementNameInputCallback) {
    achievementNameInputCallback(value.trim())
  }
  hideAchievementNameInputUI()
}

export function AchievementNameInputUI() {
  console.log('🔧 Rendering achievement name input UI')
  return (
    <UiEntity
      uiTransform={{
        width: '500px',
        height: '250px',
        positionType: 'absolute',
        position: { left: '50%', top: '40%' },
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        display: 'flex',
        zIndex: 1000
      }}
      uiBackground={{ color: Color4.create(0, 0, 0, 0.9) }}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          display: 'flex',
          margin: '0 0 20px 0'
        }}
      >
        <Label
          value={'🏆 Digite o nome da conquista:'}
          fontSize={24}
          color={Color4.White()}
          uiTransform={{ margin: '0 0 20px 0' }}
        />
      </UiEntity>
      
      <UiEntity
        uiTransform={{
          width: '400px',
          height: '50px',
          margin: '0 0 20px 0'
        }}
      >
        <Input
          value={achievementNameInputValue}
          placeholder={'Ex: Explorador do Campus Virtual'}
          fontSize={18}
          color={Color4.White()}
          onChange={value => {
            console.log('🔧 Input onChange:', value)
            achievementNameInputValue = value
          }}
          onSubmit={value => {
            console.log('🔧 Input onSubmit:', value)
            handleSubmitText(value)
          }}
          uiTransform={{ width: '400px', height: '50px' }}
        />
      </UiEntity>

      <UiEntity
        uiTransform={{
          width: '100%',
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          display: 'flex'
        }}
      >
        <Button
          value="Confirmar"
          variant="primary"
          fontSize={16}
          uiTransform={{ 
            width: '120px',
            height: '40px',
            margin: '0 10px 0 0'
          }}
          onMouseDown={() => {
            console.log('🔧 Confirm button clicked with value:', achievementNameInputValue)
            handleSubmitText(achievementNameInputValue)
          }}
        />
        
        <Button
          value="Cancelar"
          variant="secondary"
          fontSize={16}
          uiTransform={{ 
            width: '120px',
            height: '40px'
          }}
          onMouseDown={() => {
            console.log('🔧 Cancel button clicked')
            hideAchievementNameInputUI()
          }}
        />
      </UiEntity>
    </UiEntity>
  )
}

// Register the UI renderer
// ReactEcsRenderer.setUiRenderer(AchievementNameInputUI)
