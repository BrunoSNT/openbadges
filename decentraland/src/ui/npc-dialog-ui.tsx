import ReactEcs, { ReactEcsRenderer, UiEntity, Label } from '@dcl/sdk/react-ecs'
import { NpcUtilsUi } from 'dcl-npc-toolkit'
import { AchievementNameInputUI, showAchievementNameInput } from './achievement-name-ui'

const SceneOwnedUi = () => (
  <UiEntity
    uiTransform={{
      width: '100%',
      height: '100%',
    }}
  >
    {/* NPC Dialog System */}
    <NpcUtilsUi/>
    
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
  ReactEcsRenderer.setUiRenderer(SceneOwnedUi)
}
