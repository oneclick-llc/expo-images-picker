import React, { memo } from 'react'
import { FlatList, View, Text } from 'react-native'
import { Asset } from 'expo-media-library'
import styled from 'styled-components/native'
import { ItemType, AssetListPropTypes } from './Types'

const Item = ({
    id,
    screen,
    cols,
    selectedIndex,
    selectedLength,
    image,
    mediaType,
    onClick,
    onLongClick,
    margin,
    selectedIcon,
    selectedLabel,
    videoIcon,
}: ItemType) => {
    const handleClick = () => {
        onClick(id)
    }

    const handleLongClick = () => {
        onLongClick(id)
    }

    const {
        Component: SelectedIndicator,
        color: SelectedColor,
        iconName: SelectedIconName,
        size: SelectedIconSize,
        bg: SelectedIconBg,
    } = selectedIcon

    const {
        Component: SelectedLabel,
        color: SelectedLabelColor,
        size: SelectedLabelSize,
    } = selectedLabel

    const {
        Component: VideoIndicator,
        color: VideoIndicatorColor,
        iconName: VideoIndicatorName,
        size: VideoIndicatorSize,
    } = videoIcon

    return (
        <ItemContainer
            margin={margin}
            screen={screen}
            cols={cols}
            onPress={handleClick}
            onLongPress={handleLongClick}
        >
            {mediaType === 'video' && (
                <MediaTypeVideo margin={margin}>
                    {VideoIndicator && VideoIndicatorName && (
                        <VideoIndicator
                            name={VideoIndicatorName}
                            size={VideoIndicatorSize}
                            color={VideoIndicatorColor}
                        />
                    )}
                </MediaTypeVideo>
            )}
            {selectedIndex >= 0 && (
                <Selected selectionColor={SelectedIconBg} margin={margin}>
                    {selectedLength == 1 && SelectedIndicator && SelectedIconName && (
                        <SelectedIndicator
                            name={SelectedIconName}
                            size={SelectedIconSize}
                            color={SelectedColor}
                            index={selectedIndex}
                        />
                    )}
                    {selectedLength > 1 && SelectedLabel && (
                        <SelectedLabel
                            style={{
                                color: SelectedLabelColor,
                                fontSize: SelectedLabelSize
                            }}
                        >
                            {selectedIndex + 1}
                        </SelectedLabel>
                    )}
                </Selected>
            )
            }
            <Image source={{ uri: image }} />
        </ItemContainer >
    )
}

const MemoizedAssetItem = memo(Item)

export const AssetList = ({
    margin,
    data,
    selectedItems,
    onClick,
    onLongClick,
    getMoreAssets,
    cols,
    screen,
    selectedIcon,
    selectedLabel,
    videoIcon,
}: AssetListPropTypes) => {
    const _renderItem = ({ item }: { item: Asset }) => (
        <MemoizedAssetItem
            id={item.id}
            image={item.uri}
            mediaType={item.mediaType}
            selectedIndex={selectedItems.indexOf(item.id)}
            selectedLength={selectedItems.length}
            onClick={onClick}
            onLongClick={onLongClick}
            cols={cols}
            screen={screen}
            margin={margin}
            selectedIcon={selectedIcon}
            selectedLabel={selectedLabel}
            videoIcon={videoIcon}
        />
    )

    const _getItemLayout = (
        data: Asset[] | null | undefined,
        index: number
    ) => {
        let length = screen / cols
        return { length, offset: length * index, index }
    }

    return (
        <FlatList
            data={data}
            numColumns={cols}
            initialNumToRender={50}
            getItemLayout={_getItemLayout}
            renderItem={_renderItem}
            keyExtractor={(item) => item.id}
            extraData={selectedItems}
            onEndReached={() => getMoreAssets()}
            onEndReachedThreshold={0.5}
        />
    )
}

const Image = styled.Image`
    width: 100%;
    height: 100%;
`

const MediaTypeVideo = styled.View<{ margin: number }>`
    width: 25%;
    justify-content: center;
    align-items: center;
    height: 25%;
    position: absolute;
    z-index: 11;
    margin: ${({ margin }) => margin}px;
`
const Selected = styled.View<{ margin: number; selectionColor: string }>`
    position: absolute;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 10;
    background-color: ${({ selectionColor }) =>
        selectionColor ? selectionColor : '#B14AC370'};
    margin: ${({ margin }) => margin}px;
`

const ItemContainer = styled.TouchableOpacity<{
    margin: number
    screen: number
    cols: number
}>`
    width: ${({ screen, cols }) => screen / cols}px;
    height: ${({ screen, cols }) => screen / cols}px;
    padding: ${({ margin }) => margin}px;
`
