import { Tool, 
    ListToolsResult
 } from '@modelcontextprotocol/sdk/types.js'
import { Box, Button, Tabs, Text } from '@chakra-ui/react'
import ListPane from './ListPane.js'

type ToolsTabProps = {
    tools: Tool[],
    listTools: () => void,
    clearTools: () => void,
    selectedTool: Tool | null,
    setSelectedTool: (tool: Tool | null) => void,
    nextCursor: ListToolsResult["nextCursor"],
    error: string | null
}

const ToolsTab = (
    {
        tools,
        listTools,
        clearTools,
        selectedTool,
        setSelectedTool,
        nextCursor,
        error
    }: ToolsTabProps) => {


    return (
        <Tabs.Content value="tools">
            <Box>
                <ListPane
                    items={tools}
                    listItems={listTools}
                    clearItems={clearTools}
                    setSelectedItem={setSelectedTool}
                    renderItem={(tool) => (
                        <>
                            <Button variant="solid" size="xs" colorPalette="gray" >{`${tool.name}`}</Button> 
                            <Text fontSize="xs">{tool.description}</Text>
                        </>        
                    )}
                    title="Tools"
                    buttonText={nextCursor ? "Load More" : "List Tools"}
                    isButtonDisabled={!nextCursor && tools.length > 0}
                />
            </Box>
        </Tabs.Content>
    )
}

export default ToolsTab;