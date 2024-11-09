import { jsonRender } from "../../../src/ui/panel-ui";

const aboutModule = {
    menuText: "关于",
    icon: "data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iaWNvbiIgc3R5bGU9IndpZHRoOiAxZW07aGVpZ2h0OiAxZW07dmVydGljYWwtYWxpZ246IG1pZGRsZTtmaWxsOiBjdXJyZW50Q29sb3I7b3ZlcmZsb3c6IGhpZGRlbjsiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBwLWlkPSI1NzM5Ij48cGF0aCBkPSJNNTIxLjIxNiA4Ny41MDU0NTVjLTU1Ljg1NDU0NSAwLTEwMi40IDQ2LjU0NTQ1NS0xMDIuNCAxMDIuNHM0Ni41NDU0NTUgMTAyLjQgMTAyLjQgMTAyLjQgMTAyLjQtNDYuNTQ1NDU1IDEwMi40LTEwMi40LTQ2LjU0NTQ1NS0xMDIuNC0xMDIuNC0xMDIuNHpNMjc5LjI3MjcyNyAzNzIuMzYzNjM2bC0wLjA5MzA5MSA2OC44ODcyNzNTNDE4LjkwOTA5MSA0MzEuMzgzMjczIDQxOC45MDkwOTEgNTU4LjU0NTQ1NXYxMzkuNjM2MzYzYzAgMTM5LjYzNjM2NC0xMzkuNzI5NDU1IDE2MS45NzgxODItMTM5LjcyOTQ1NSAxNjEuOTc4MTgyTDI3OS4yNzI3MjcgOTMwLjkwOTA5MWg0ODQuMDcyNzI4bC0wLjA5MzA5MS03MC43NDkwOTFzLTExMS43MDkwOTEgMC0xMTEuNzA5MDkxLTEzOS42MzYzNjRMNjUxLjYzNjM2NCA0NjUuNDU0NTQ1czAtOTMuMDkwOTA5LTkzLjA5MDkwOS05My4wOTA5MDlIMjc5LjI3MjcyN3oiIGZpbGw9IiMwMTAxMDEiIHAtaWQ9IjU3NDAiPjwvcGF0aD48L3N2Zz4=",
    onOpend: ctx => {
        jsonRender({
            "版本信息": {
                "版本号": ctx.godInfo.version
            }
        })
    }
};

export {
    aboutModule
}