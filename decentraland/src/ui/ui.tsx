import ReactEcs, { UiEntity, Label, ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { AchievementNameInputUI } from './achievement-name-ui'

// This is the main root UI component that renders all other UI
const RootUI = () => {
  return (
    <UiEntity>
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
      {/* The AchievementNameInputUI is rendered here conditionally */}
      <AchievementNameInputUI />
    </UiEntity>
  )
}

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(RootUI)
}
