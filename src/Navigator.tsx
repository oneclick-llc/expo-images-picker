import React from 'react'
import { Button, Text, View } from 'react-native'
import styled from 'styled-components/native'
import { NavigatorType, SelectionMode } from './Types'
import Ionicons from '@expo/vector-icons/Ionicons'

const Navigator = ({
    Texts,
    selected,
    onBack,
    midTextColor,
    onSuccess,
    minSelection,
    buttonTextStyle,
    buttonStyle,
    mode,
    onMode,
    onCamera
}: NavigatorType) => {
    const handleActionRequest = () => {
        if (!minSelection) return onSuccess()
        if (selected) {
            return selected >= minSelection && onSuccess()
        }
    }
    return (
        <Container>
            <LeftContainer>
                {Texts.back.length > 0 ?
                    <SimpleButton style={buttonStyle} onPress={onBack}>
                        <Text style={buttonTextStyle}>{Texts.back}</Text>
                    </SimpleButton>
                    : <></>}
            </LeftContainer>

            <MidContainer>
                {Texts.selected.length > 0 ?
                    <Text style={{ color: midTextColor }}>
                        {selected} {Texts.selected}
                    </Text>
                    : <></>}
            </MidContainer>

            <RightContainer>
                <ActionButton onPress={onMode} bgColor={mode == SelectionMode.Single ? '#353535' : 'tomato'} >
                    <Ionicons name={mode == SelectionMode.Single ? 'albums-outline' : 'albums'} size={24} color={'white'} />
                </ActionButton>

                <ActionButton onPress={onCamera} bgColor={'#353535'} >
                    <Ionicons name={'camera-outline'} size={24} color={'white'} />
                </ActionButton>

                {Texts.finish.length > 0 ?
                    <SimpleButton style={buttonStyle} onPress={handleActionRequest}>
                        <Text style={buttonTextStyle}>{Texts.finish}</Text>
                    </SimpleButton>
                    : <></>}
            </RightContainer>
        </Container>
    )
}

export default Navigator

const SimpleButton = styled.TouchableOpacity`
    justify-content: center;
    align-items: center;
    width: 100px;
    height: 38px;
`
const LeftContainer = styled.View`
    justify-content: center;
    align-items: center;
    flex-direction: row;
`

const MidContainer = styled.View`
    justify-content: center;
    align-items: center;
    flex-direction: row;
`

const RightContainer = styled.View`
    justify-content: center;
    align-items: center;
    flex-direction: row;
`

const Container = styled.View`
    width: 98%;
    margin: 0 auto;
    flex-direction: row;
    justify-content: space-between;
    height: 45px;
    padding: 5px;
`

const ActionButton = styled.TouchableOpacity`
    justify-content: center;
    align-items: center;
    margin: 5px;
    width: 40px;
    height: 40px;
    borderRadius: 50px;
    backgroundColor: ${({ bgColor }) => bgColor || 'white'};
`
