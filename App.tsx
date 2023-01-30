import { GoTrueClient, Session, User } from '@supabase/gotrue-js'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native'

import 'react-native-url-polyfill/auto'

const GOTRUE_URL = 'http://172.20.10.4:9999'
const auth = new GoTrueClient({ url: GOTRUE_URL })

const App: React.FC = () => {
	const [user, setUser] = useState<User>()

	console.log({ user })
	useEffect(() => {
		const listener = Linking.addEventListener('url', ({ url }) => {
			const parsed = new URL(url)
			const params = new URLSearchParams(parsed.hash.substring(1))
			const sess = Object.fromEntries(params.entries()) as unknown as Omit<
				Session,
				'user' | 'expires_at'
			>
			;(async () => {
				const { data } = await auth.setSession({
					access_token: sess.access_token,
					refresh_token: sess.refresh_token,
				})
				if (!data.user) {
					return Alert.alert('Failed to load user info')
				}
				setUser(data.user)
			})()
		})
		return () => listener.remove()
	}, [])

	const initiateKakoLogin = useCallback(async () => {
		const initialUrl = await Linking.getInitialURL()
		await auth.initialize()
		const {
			data: { url },
			error,
		} = await auth.signInWithOAuth({
			//@ts-ignore
			provider: 'kakao',
			options: {
				redirectTo: 'net.esinx.kakao-login-demo://callback',
			},
		})
		if (!url) throw new Error('URL is null')
		const redirected = await fetch(url)
		const parsed = new URL(redirected.url)
		const authorizeLink = parsed.searchParams.get('continue')
		if (!authorizeLink) throw new Error('URL is null')
		const deeplink = `https://talk-apps.kakao.com/scheme/${encodeURIComponent(
			`kakaotalk://inappbrowser?url=${encodeURIComponent(authorizeLink)}`,
		)}`
		Linking.openURL(deeplink)
	}, [])

	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#222',
			}}
		>
			{user ? (
				<View
					style={{
						alignItems: 'center',
					}}
				>
					<Image
						style={{ width: 200, height: 200, borderRadius: 16 }}
						source={{
							uri: user.user_metadata.avatar_url,
						}}
					/>
					<Text
						style={{
							marginTop: 12,
							fontWeight: 'bold',
							fontSize: 24,
							color: '#fff',
						}}
					>
						{user.user_metadata.name}
					</Text>
				</View>
			) : (
				<Text
					style={{
						fontWeight: 'bold',
						fontSize: 24,
						color: '#fff',
					}}
				>
					No Login Info
				</Text>
			)}
			<Pressable
				onPress={() => {
					initiateKakoLogin()
				}}
				style={({ pressed }) => [
					{
						marginTop: 24,
						borderRadius: 4,
						paddingVertical: 12,
						paddingHorizontal: 20,
						backgroundColor: '#fde333',
					},
					{ opacity: pressed ? 0.5 : 1 },
				]}
			>
				<Text
					style={{
						fontWeight: 'bold',
						color: '#181601',
					}}
				>
					Initiate Kakao Login
				</Text>
			</Pressable>
		</View>
	)
}
export default App
