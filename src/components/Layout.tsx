import { Box } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box minH="100vh" width="100%" bg="gray.500">
        {children}
    </Box>
  )
}
