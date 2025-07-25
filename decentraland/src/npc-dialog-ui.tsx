import ReactEcs, { ReactEcsRenderer, UiEntity, Label } from '@dcl/sdk/react-ecs'
import { NpcUtilsUi } from 'dcl-npc-toolkit'
import { AchievementNameInputUI, showAchievementNameInput } from './ui/achievement-name-ui'
import { engine } from '@dcl/sdk/ecs'

// Defensive wrapper for NpcUtilsUi to handle potential errors
const SafeNpcUtilsUi = () => {
  try {
    return <NpcUtilsUi />
  } catch (error) {
    console.error('⚠️ NpcUtilsUi error (continuing without UI):', error)
    return null
  }
}

const SceneOwnedUi = () => (
  <UiEntity
    uiTransform={{
      width: '100%',
      height: '100%',
    }}
  >
    {/* NPC Dialog System with error handling */}
    <SafeNpcUtilsUi />
    
    {/* System Banner */}
    <Label
      value={`🎯 Sistema Open Badges 3.0 - Interaja com os NPCs!`}
      fontSize={14}
      uiTransform={{
        width: '120%',
        height: 50,
        positionType: 'absolute',
        position: { top: 10, left: 10 }
      }}
    />
    
    {/* Custom Achievement Name Input UI - Only render when needed */}
    {showAchievementNameInput && <AchievementNameInputUI />}
  </UiEntity>
)

export function setupUi() {
  try {
    console.log('🎨 Setting up UI renderer...')
    ReactEcsRenderer.setUiRenderer(SceneOwnedUi)
    console.log('✅ UI renderer setup complete')
  } catch (error) {
    console.error('❌ Error setting up UI renderer:', error)
    // Try simplified setup without NPC UI
    const FallbackUi = () => (
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
        }}
      >
        <Label
          value={`🎯 Sistema Open Badges 3.0 - Interaja com os NPCs! (Modo Limitado)`}
          fontSize={14}
          uiTransform={{
            width: '120%',
            height: 50,
            positionType: 'absolute',
            position: { top: 10, left: 10 }
          }}
        />
      </UiEntity>
    )
    
    try {
      ReactEcsRenderer.setUiRenderer(FallbackUi)
      console.log('✅ Fallback UI renderer setup complete')
    } catch (fallbackError) {
      console.error('❌ Fallback UI renderer failed:', fallbackError)
    }
  }
}
