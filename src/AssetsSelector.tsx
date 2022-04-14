import React, { FC, useCallback, useEffect, useMemo, useState, useImperativeHandle } from 'react'
import { Dimensions, View, ActivityIndicator, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import * as MediaLibrary from 'expo-media-library'
import {
    Asset,
    AssetsOptions,
    getAssetsAsync,
    getAssetInfoAsync,
    Subscription
} from 'expo-media-library'
import { AssetList } from './AssetList'
import DefaultTopNavigator from './Navigator'
import * as ImageManipulator from 'expo-image-manipulator'

import {
    AssetSelectorPropTypes,
    IAssetSelectorError,
    IScreen,
    IWidget,
    PagedInfo,
    ResizeType,
} from './Types'
import { ImageResult } from 'expo-image-manipulator'
import ErrorDisplay from './ErrorDisplay'

const initialAvailableOptions = {
    first: 100,
    totalCount: 0,
    after: '',
    endCursor: '',
    hasNextPage: true,
};

const AssetsSelector = React.forwardRef(({
    Resize,
    Settings,
    Errors,
    Styles,
    Navigator,
    CustomNavigator,
    onPreviewSourceUpdated
}: AssetSelectorPropTypes, ref) => {
    const getScreen = () => Dimensions.get('screen')

    const { width, height } = useMemo(() => getScreen(), [])

    const COLUMNS =
        height >= width ? Settings.portraitCols : Settings.landscapeCols

    const [selectedItems, setSelectedItems] = useState<string[]>([])

    const [permissions, setPermissions] = useState({
        hasMediaLibraryPermission: false,
    })

    const [availableOptions, setAvailableOptions] = useState<PagedInfo>({
        ...initialAvailableOptions
    })

    const [assetItems, setItems] = useState<Asset[]>([])

    const [isLoading, setLoading] = useState(true)

    const [shouldReload, setShouldReload] = useState(false)

    const [hasLibraryUpdates, setHasLibraryUpdates] = useState<boolean>(false)

    const [error, setError] = useState<{
        hasError: boolean
        errorType: IAssetSelectorError
    }>({
        hasError: false,
        errorType: 'hasErrorWithPermissions',
    })

    useImperativeHandle(ref, () => ({
        reloadAssets: () => {
            console.log('AssetsSelector is reloading assets on call by ref')
            setSelectedItems([])
            setItems([])
            setAvailableOptions({ ...initialAvailableOptions })
            setShouldReload(true)
        },
        getSelectedAssets: () => {
            return selectedItems.map(item => assetItems.find(asset => asset.id == item))
        }
    }));

    useEffect(() => {
        console.log('123 subbed')
        let subscription = MediaLibrary.addListener((assetChangeEventiOS) => {
            setHasLibraryUpdates(true)
        })
        return () => {
            console.log('123 unsubbed')
            subscription.remove()
        };
    }, []);

    useEffect(() => {
        if (!hasLibraryUpdates || !permissions.hasMediaLibraryPermission) {
            return
        }

        const params: AssetsOptions = {
            first: 50,
            mediaType: Settings.assetsType,
            // sortBy: ['creationTime'], // on android the camera does not treat creationTime well for photos made with it. Only works with modificaitonTime.
            sortBy: ['modificationTime'],
        }
        setHasLibraryUpdates(false)
        setLoading(true)
        getAssetsAsync(params)
            .then(({ endCursor, assets, hasNextPage }) => {
                setLoading(false)
                if (assets.length <= 0) {
                    console.log('library update hook returned no assets')
                    return
                }
                assets = assets.filter(x => assetItems.findIndex(y => y.id === x.id) < 0)
                console.log('new assets', assets.length)
                setItems([...assets, ...assetItems])
            })
            .catch((error) => {
                setLoading(false)
                console.log('library update hook finished with error', error)
            })
    }, [hasLibraryUpdates]);

    const loadAssets = useCallback(
        async (params: AssetsOptions) => {
            getAssetsAsync(params)
                .then(({ endCursor, assets, hasNextPage }) => {
                    if (assets.length <= 0) {
                        setLoading(false)
                        return setError({
                            hasError: true,
                            errorType: 'hasNoAssets',
                        })
                    }
                    if (availableOptions.after === endCursor) return
                    setAvailableOptions({
                        ...availableOptions,
                        after: endCursor,
                        hasNextPage: hasNextPage,
                    })
                    setLoading(false)
                    setItems([...assetItems, ...assets])
                    if (selectedItems.length < Settings.minSelection) {
                        setSelectedItems([...selectedItems, assets[0].id])
                    }
                })
                .catch(() => {
                    setLoading(false)
                    setError({
                        hasError: true,
                        errorType: 'hasErrorWithLoading',
                    })
                })
        },
        [assetItems]
    )

    const getMediaLibraryPermission = useCallback(async () => {
        try {
            const {
                status: MEDIA_LIBRARY,
            }: MediaLibrary.PermissionResponse = await MediaLibrary.requestPermissionsAsync()
            if (MEDIA_LIBRARY !== 'granted') {
                setLoading(false)
                setError({
                    hasError: true,
                    errorType: 'hasErrorWithPermissions',
                })
            }
            setPermissions({
                hasMediaLibraryPermission: MEDIA_LIBRARY === 'granted',
            })
        } catch (err) {
            setError({
                hasError: true,
                errorType: 'hasErrorWithPermissions',
            })
        }
    }, [])

    const onClickUseCallBack = useCallback((id: string) => {
        setSelectedItems((selectedItems) => {
            const alreadySelected = selectedItems.indexOf(id) >= 0
            if (selectedItems.length >= Settings.maxSelection &&
                !alreadySelected) {
                return selectedItems
            }

            if (alreadySelected) {
                if (selectedItems.length - 1 >= Settings.minSelection) {
                    return selectedItems.filter((item) => item !== id)
                }
                else {
                    return selectedItems
                }
            }

            else return [...selectedItems, id]
        })
    }, [])

    useEffect(() => {
        Errors.onError?.()
        getAssets()
    }, [Settings.assetsType, permissions.hasMediaLibraryPermission])

    useEffect(() => {
        if (shouldReload) {
            getAssets()
        }
    }, [shouldReload])

    useEffect(() => {
        if (selectedItems.length > 0) {
            let lastId = selectedItems[selectedItems.length - 1]
            onPreviewSourceUpdated(assetItems.find(x => x.id == lastId))
        }
        else {
            onPreviewSourceUpdated(undefined)
        }
    }, [selectedItems])

    const getAssets = () => {
        try {
            if (availableOptions.hasNextPage) {
                const params: AssetsOptions = {
                    first: 100,
                    mediaType: Settings.assetsType,
                    // sortBy: ['creationTime'], // on android the camera does not treat creationTime well for photos made with it. Only works with modificaitonTime.
                    sortBy: ['modificationTime'],
                }
                if (availableOptions.after)
                    params.after = availableOptions.after
                if (!availableOptions.hasNextPage) return

                return permissions.hasMediaLibraryPermission
                    ? loadAssets(params)
                    : getMediaLibraryPermission()
            }
        } catch (err) {
            setError({
                hasError: true,
                errorType: 'hasErrorWithLoading',
            })
        }
        return; // only added because of `noImplicitReturns` ugly rule.
    }

    const resizeImages = async (image: Asset, manipulate: ResizeType) => {
        try {
            const { base64, width, height, saveTo, compress } = manipulate
            const saveFormat = saveTo
                ? saveTo === 'jpeg'
                    ? ImageManipulator.SaveFormat.JPEG
                    : ImageManipulator.SaveFormat.PNG
                : ImageManipulator.SaveFormat.JPEG

            let sizeOptions: {
                width?: number
                height?: number
            } = {
                width,
                height,
            }

            if (!width && !height) {
                sizeOptions.width = image.width
                sizeOptions.height = image.height
            }
            const options = [
                {
                    resize: JSON.parse(JSON.stringify(sizeOptions)),
                },
            ]
            const format = {
                base64,
                compress,
                format: saveFormat,
            }
            return await ImageManipulator.manipulateAsync(
                image.uri,
                options,
                format
            )
        } catch (err) {
            setError({
                hasError: true,
                errorType: 'hasErrorWithResizing',
            })
            return image
        }
    }

    const prepareResponse = useCallback(
        () =>
            assetItems
                .filter(
                    (asset: { id: any }) =>
                        selectedItems.indexOf(asset.id) !== -1
                )
                .sort(
                    (a, b) =>
                        selectedItems.indexOf(a.id) -
                        selectedItems.indexOf(b.id)
                ),
        [selectedItems]
    )

    const manipulateResults = async (source: string) => {
        setLoading(true)
        const selectedAssets = prepareResponse()
        try {
            const selectedItemsMetaData: any[] = []
            if (Settings.getImageMetaData && !Resize) {
                await asyncForEach(selectedAssets, async (asset: Asset) => {
                    const metaAsset = await getAssetInfoAsync(asset)
                    selectedItemsMetaData.push(metaAsset)
                })
                return responseWithResults(source, selectedItemsMetaData)
            }
            if (Resize) {
                let modAssets: (ImageManipulator.ImageResult &
                    Pick<MediaLibrary.Asset, 'mediaType'>)[] = []
                await asyncForEach(selectedAssets, async (asset: Asset) => {
                    if (asset.mediaType === 'photo') {
                        const resizedImage = await resizeImages(asset, Resize)
                        modAssets.push({
                            ...resizedImage,
                            mediaType: asset.mediaType,
                        })
                    } else modAssets.push(asset)
                })
                return responseWithResults(source, modAssets)
            }
            return responseWithResults(source, selectedAssets)
        } catch (err) {
            setError({
                hasError: true,
                errorType: 'hasErrorWithResizing',
            })
            return responseWithResults(source, selectedAssets)
        } finally {
            setLoading(false)
        }
    }

    const responseWithResults = (
        navigation: string,
        assets: Asset[] | ImageResult[]
    ) => {
        const _default = navigation === 'default'
        return _default
            ? Navigator?.onSuccess(assets)
            : CustomNavigator?.props.onSuccess(assets)
    }
    return (
        <Screen bgColor={Styles.bgColor} style={Styles.screenStyle}>
            {CustomNavigator?.Component && (
                <CustomNavigator.Component
                    {...CustomNavigator.props}
                    selected={selectedItems.length}
                    onSuccess={() => manipulateResults('custom')}
                />
            )}
            {Navigator && (
                <DefaultTopNavigator
                    Texts={Navigator.Texts}
                    selected={selectedItems.length}
                    onBack={() => Navigator.onBack()}
                    midTextColor={Navigator.midTextColor || 'black'}
                    onSuccess={() => manipulateResults('default')}
                    minSelection={Navigator.minSelection}
                    buttonTextStyle={Navigator.buttonTextStyle}
                    buttonStyle={Navigator.buttonStyle}
                />
            )}

            {isLoading ? (
                <Spinner color={Styles.spinnerColor} />
            ) : error.hasError ? (
                <HasError bgColor={Styles.bgColor}>
                    <ErrorDisplay
                        errorType={error.errorType}
                        errorTextColor={Errors.errorTextColor}
                        errorMessages={Errors.errorMessages}
                    />
                </HasError>
            ) : (
                <Widget
                    widgetWidth={Styles.widgetWidth}
                    bgColor={Styles.bgColor}
                    style={Styles.widgetStyle}
                >
                    <AssetList
                        cols={COLUMNS}
                        margin={Styles.margin}
                        data={assetItems}
                        getMoreAssets={getAssets}
                        onClick={onClickUseCallBack}
                        selectedItems={selectedItems}
                        screen={(width * Styles.widgetWidth) / 100}
                        selectedIcon={Styles.selectedIcon}
                        selectedLabel={Styles.selectedLabel}
                        videoIcon={Styles.videoIcon}
                    />
                </Widget>
            )}
        </Screen>
    )
})

async function asyncForEach(array: Asset[], callback: any) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

const SpinnerStyle = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
    },
})

const Spinner: FC<{ color: string }> = ({ color }) => {
    return (
        <View style={[SpinnerStyle.container, SpinnerStyle.horizontal]}>
            <ActivityIndicator size="large" color={color} />
        </View>
    )
}

const HasError = styled.View<IScreen>`
    background-color: ${({ bgColor }) => bgColor};
    flex: 1;
    justify-content: center;
    align-items: center;
`

const Screen = styled.View<IScreen>`
    background-color: ${({ bgColor }) => bgColor};
    flex: 1;
`

const Widget = styled.View<IWidget>`
    margin: 0 auto;
    flex-direction: row;
    justify-content: space-between;
    background-color: ${({ bgColor }) => bgColor};
    width: ${({ widgetWidth }) => widgetWidth || 100}%;
    flex: 1;
`

export default AssetsSelector
