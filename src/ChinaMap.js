import { Component } from "react";
import axios from "axios";
import * as echarts from "echarts";
import { mapCode } from './assets/js/mapCode.js';
import * as cn from 'china-region'
import './ChinaMap.css';

class ChinaMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            map: null,
            selectedMaps: { name: 'China', code: '100000' },
            data: [],
            mapData: []
        };
    }

    render() {
        return (
            <div className='container'>
                <h1 className='title' onClick={this.refresh} > China Covid Map </h1>
                <div className='ChinaMap' id='ChinaMap' />
            </div>
        );
    }

    refresh = () => {
        this.setState({ selectedMaps: { name: 'China', code: '100000' } });

        let file = `/json/map/100000.json`;

        axios.get(file).then((res) => {
            if (res.status === 200) {
                const mapJSON = res.data;
                let newMap = this.drawMapChart(this.state.selectedMaps.name, mapJSON, []);
                this.setState({ map: newMap });
                let newData = [];
                for (let i = 0; i < this.state.data.length; i++) {
                    newData.push({
                        name: this.chn_short2long.get(this.state.data[i].name),
                        value: this.state.data[i].total.nowConfirm
                    });
                }
                this.setState({ mapData: newData });
            }
        }).catch(err => {
        });
    }

    chn_short2long = new Map([
        ['台湾', '台湾省'],
        ['上海', '上海市'],
        ['吉林', '吉林省'],
        ['浙江', '浙江省'],
        ['广东', '广东省'],
        ['福建', '福建省'],
        ['山东', '山东省'],
        ['四川', '四川省'],
        ['江苏', '江苏省'],
        ['海南', '海南省'],
        ['北京', '北京市'],
        ['山西', '山西省'],
        ['陕西', '陕西省'],
        ['云南', '云南省'],
        ['河北', '河北省'],
        ['河南', '河南省'],
        ['辽宁', '辽宁省'],
        ['青海', '青海省'],
        ['安徽', '安徽省'],
        ['湖南', '湖南省'],
        ['江西', '江西省'],
        ['天津', '天津市'],
        ['湖北', '湖北省'],
        ['贵州', '贵州省'],
        ['重庆', '重庆市'],
        ['甘肃', '甘肃省'],
        ['黑龙江', '黑龙江省'],
        ['内蒙古', '内蒙古自治区'],
        ['广西', '广西壮族自治区'],
        ['宁夏', '宁夏回族自治区'],
        ['西藏', '西藏自治区'],
        ['新疆', '新疆维吾尔自治区'],
        ['香港', '香港特别行政区'],
        ['澳门', '澳门特别行政区'],
    ]);

    componentDidMount() {
        let file = `/json/map/${this.state.selectedMaps.code}.json`;

        axios.get(file).then((res) => {
            if (res.status === 200) {
                const mapJSON = res.data;
                let newMap = this.drawMapChart(this.state.selectedMaps.name, mapJSON, []);
                this.setState({ map: newMap });
            }
        }).catch(err => {
        });

        const api = "https://api.inews.qq.com/newsqa/v1/query/inner/publish/modules/list?modules=statisGradeCityDetail,diseaseh5Shelf";
        axios.get(api, {
            withCredentials: false,
             headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
        }).then((res) => {
            if (res.status === 200) {
                console.log('get data');
                let stats = res.data.data.diseaseh5Shelf.areaTree[0].children || [];
                this.setState({ data: stats });
                let newData = [];
                for (let i = 0; i < stats.length; i++) {
                    newData.push({ name: this.chn_short2long.get(stats[i].name), value: stats[i].total.nowConfirm });
                }
                this.setState({ mapData: newData });
            }
        });
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.mapData !== this.state.mapData) {
            console.log('update data');
            this.state.map.setOption({
                series: [
                    {
                        type: 'map',
                        mapType: this.state.selectedMaps.name,
                        roam: false,
                        data: this.state.mapData,
                    }
                ]
            });
        }
    }

    drawMapChart(mapName, mapJSON, data) {
        let mapDOM = document.getElementById("ChinaMap");
        let instance = echarts.getInstanceByDom(mapDOM);
        if (instance) {
            echarts.dispose(instance);
        }
        console.log('draw map');
        let newMap = echarts.init(mapDOM);
        echarts.registerMap(mapName, mapJSON);
        newMap.setOption({
            tooltip: {
                trigger: 'item'
            },
            visualMap: {
                type: 'piecewise',
                pieces: [
                    { min: 10000, label: 'over 10000', color: '#DC1F05FF' },
                    { min: 1000, max: 9999, label: '1000-9999', color: '#FD2736FF' },
                    { min: 500, max: 999, label: '500-999', color: '#FD6240FF' },
                    { min: 100, max: 499, label: '100-499', color: '#FDA476FF' },
                    { min: 10, max: 99, label: '10-99', color: '#FDCC9FFF' },
                    { min: 1, max: 9, label: '1-9', color: '#FDCEA5FF' },
                    { min: 0, max: 0, label: '0', color: '#E0E9F2FF' }
                ]
            },
            toolbox: {
                show: true,
                orient: 'vertical',
                left: 'right',
                top: 'center',
                feature: {
                    mark: { show: true },
                    dataView: { show: true, readOnly: false },
                    restore: { show: true },
                    saveAsImage: { show: true }
                }
            },
            series: [
                {
                    name: 'Confirmed Cases:',
                    type: 'map',
                    mapType: mapName,
                    roam: false,
                    data: data,
                }
            ]
        });

        newMap.on('click', function (params) {
            console.log(params);
            const newCode = mapCode[params.name];
            if (newCode) {
                let file = `/json/map/${newCode}.json`;
                this.setState({ selectedMaps: { name: params.name, code: newCode } });
                axios.get(file).then((res) => {
                    if (res.status === 200) {
                        const mapJSON = res.data;
                        let newMap = this.drawMapChart(params.name, mapJSON, []);
                        this.setState(() => ({
                            map: newMap
                        }));
                        this.setState(() => ({
                            selectedMaps: { name: params.name, code: newCode }
                        }));

                        console.log(params.name, newCode);

                        let cities = cn.getPrefectures(newCode);
                        if (cities.length === 0) cities = cn.getCounties(newCode);

                        console.log(cities);

                        for (let i = 0; i < this.state.data.length; i++) {
                            if (this.chn_short2long.get(this.state.data[i].name) === params.name) {
                                let stats = this.state.data[i].children;
                                for (let j = 0; j < cities.length; j++) {
                                    cities[j].value = 0;
                                    for (let k = 0; k < stats.length; k++) {
                                        if (cities[j].name.includes(stats[k].name)) {
                                            cities[j].value = stats[k].total.nowConfirm;
                                            break;
                                        }
                                    }
                                }
                                break;
                            }
                        }

                        cities.forEach(function (v) {
                            delete v.code
                        });
                        console.log(cities);

                        this.setState(() => ({
                            mapData: cities
                        }));
                    }
                }).catch(err => {
                });
            } else {
                console.log('no map data');
            }

        }.bind(this));

        return newMap;
    }
}

export default ChinaMap;
